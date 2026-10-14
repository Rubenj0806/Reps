import type { Metric, SetLog, Workout, WorkoutExercise } from '../types';

/**
 * 1RM estimado con la fórmula de Epley: peso × (1 + reps / 30).
 * Con una sola repetición, el 1RM es el propio peso.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function doneSets(exercise: WorkoutExercise): SetLog[] {
  return exercise.sets.filter((s) => s.done && s.reps > 0);
}

/** Volumen = suma de peso × repeticiones de las series completadas. */
export function exerciseVolume(exercise: WorkoutExercise): number {
  return doneSets(exercise).reduce((sum, s) => sum + s.weight * s.reps, 0);
}

export function workoutVolume(workout: Workout): number {
  return workout.exercises.reduce((sum, e) => sum + exerciseVolume(e), 0);
}

export function workoutSetCount(workout: Workout): number {
  return workout.exercises.reduce((sum, e) => sum + doneSets(e).length, 0);
}

export function workoutDurationMin(workout: Workout, now: Date = new Date()): number {
  const end = workout.finishedAt ? new Date(workout.finishedAt) : now;
  return Math.max(0, Math.round((end.getTime() - new Date(workout.startedAt).getTime()) / 60000));
}

export interface Session {
  workoutId: string;
  date: string;
  e1rm: number;
  maxWeight: number;
  maxReps: number;
  volume: number;
  best: SetLog | null;
}

/** Una entrada por cada entreno terminado en el que se hizo el ejercicio, de más antigua a más reciente. */
export function exerciseSessions(workouts: Workout[], exerciseId: string): Session[] {
  const sessions: Session[] = [];
  for (const w of workouts) {
    if (!w.finishedAt) continue;
    const sets = w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap(doneSets);
    if (!sets.length) continue;
    let best: SetLog | null = null;
    let e1rm = 0;
    for (const s of sets) {
      const value = estimate1RM(s.weight, s.reps);
      if (value > e1rm || (value === e1rm && best && s.reps > best.reps)) {
        e1rm = value;
        best = s;
      }
    }
    sessions.push({
      workoutId: w.id,
      date: w.startedAt,
      e1rm: round1(e1rm),
      maxWeight: Math.max(...sets.map((s) => s.weight)),
      maxReps: Math.max(...sets.map((s) => s.reps)),
      volume: sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
      best: best ?? sets[0],
    });
  }
  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}

/** En ejercicios con peso corporal (peso 0) el progreso se mide por repeticiones. */
export function isBodyweightHistory(sessions: Session[]): boolean {
  return sessions.length > 0 && sessions.every((s) => s.maxWeight === 0);
}

export function metricValue(session: Session, metric: Metric): number {
  return session[metric];
}

export interface PersonalRecord {
  value: number;
  metric: 'e1rm' | 'maxReps';
  set: SetLog;
  date: string;
}

export function personalRecord(workouts: Workout[], exerciseId: string): PersonalRecord | null {
  const sessions = exerciseSessions(workouts, exerciseId);
  if (!sessions.length) return null;
  const metric = isBodyweightHistory(sessions) ? 'maxReps' : 'e1rm';
  let top = sessions[0];
  for (const s of sessions) if (s[metric] > top[metric]) top = s;
  const set = metric === 'maxReps' ? { weight: 0, reps: top.maxReps, done: true } : (top.best as SetLog);
  return { value: top[metric], metric, set, date: top.date };
}

/** Ejercicios del entreno que superan el mejor registro anterior. */
export function newRecords(previous: Workout[], workout: Workout): string[] {
  const ids = [...new Set(workout.exercises.map((e) => e.exerciseId))];
  return ids.filter((id) => {
    const current = exerciseSessions([workout], id)[0];
    if (!current) return false;
    const before = exerciseSessions(previous, id);
    if (!before.length) return false; // la primera vez no cuenta como récord
    const metric = isBodyweightHistory([...before, current]) ? 'maxReps' : 'e1rm';
    return current[metric] > Math.max(...before.map((s) => s[metric]));
  });
}

/** Series de la última vez que se hizo un ejercicio, para proponer pesos al empezar. */
export function lastPerformance(workouts: Workout[], exerciseId: string): SetLog[] | null {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const ex = workouts[i].exercises.find((e) => e.exerciseId === exerciseId);
    if (ex) {
      const sets = doneSets(ex);
      if (sets.length) return sets;
    }
  }
  return null;
}

/** Ejercicios realizados, del más frecuente al menos. */
export function trainedExercises(workouts: Workout[]): string[] {
  const count = new Map<string, number>();
  for (const w of workouts)
    for (const e of w.exercises) if (doneSets(e).length) count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

/** Lunes de la semana de una fecha, a las 00:00 hora local. */
export function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  return d;
}

export interface WeekStat {
  start: Date;
  count: number;
  volume: number;
}

export function weeklyStats(workouts: Workout[], now: Date, weeks = 8): WeekStat[] {
  const current = weekStart(now);
  const result: WeekStat[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(current);
    start.setDate(start.getDate() - i * 7);
    result.push({ start, count: 0, volume: 0 });
  }
  for (const w of workouts) {
    if (!w.finishedAt) continue;
    const ws = weekStart(new Date(w.startedAt)).getTime();
    const slot = result.find((r) => r.start.getTime() === ws);
    if (slot) {
      slot.count += 1;
      slot.volume += workoutVolume(w);
    }
  }
  return result;
}

/**
 * Semanas seguidas entrenando al menos una vez. La semana actual cuenta si ya
 * tiene entreno; si no, la racha se mide desde la semana pasada.
 */
export function weekStreak(workouts: Workout[], now: Date): number {
  const weeks = new Set(workouts.filter((w) => w.finishedAt).map((w) => weekStart(new Date(w.startedAt)).getTime()));
  const cursor = weekStart(now);
  if (!weeks.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);
  let streak = 0;
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
