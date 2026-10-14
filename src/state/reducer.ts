import type { AppState, Routine, SetLog, Workout } from '../types';
import { lastPerformance } from '../lib/stats';
import { SAMPLE_ROUTINES, createSampleWorkouts } from './sample';

export type Action =
  | { type: 'startWorkout'; routineId: string | null; id: string; now: string }
  | { type: 'updateSet'; ex: number; set: number; field: 'weight' | 'reps'; value: number }
  | { type: 'toggleSet'; ex: number; set: number }
  | { type: 'addSet'; ex: number }
  | { type: 'removeSet'; ex: number; set: number }
  | { type: 'addExercise'; exerciseId: string }
  | { type: 'removeExercise'; ex: number }
  | { type: 'finishWorkout'; now: string }
  | { type: 'discardWorkout' }
  | { type: 'saveRoutine'; routine: Routine }
  | { type: 'deleteRoutine'; id: string }
  | { type: 'deleteWorkout'; id: string }
  | { type: 'clearSampleData' }
  | { type: 'loadSampleData'; now: Date }
  | { type: 'replaceState'; state: AppState };

const DEFAULT_REST = 90;

/** Prepara las series de un ejercicio usando los pesos de la última vez. */
function plannedSets(state: AppState, exerciseId: string, sets: number, reps: number): SetLog[] {
  const last = lastPerformance(state.workouts, exerciseId);
  return Array.from({ length: Math.max(1, sets) }, (_, i) => {
    const prev = last?.[Math.min(i, last.length - 1)];
    return { weight: prev?.weight ?? 0, reps: reps || prev?.reps || 10, done: false };
  });
}

function updateActive(state: AppState, fn: (w: Workout) => Workout): AppState {
  return state.active ? { ...state, active: fn(state.active) } : state;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'startWorkout': {
      if (state.active) return state; // solo un entreno a la vez
      const routine = state.routines.find((r) => r.id === action.routineId) ?? null;
      const workout: Workout = {
        id: action.id,
        routineId: routine?.id ?? null,
        name: routine?.name ?? 'Entreno libre',
        startedAt: action.now,
        finishedAt: null,
        exercises: (routine?.items ?? []).map((item) => ({
          exerciseId: item.exerciseId,
          restSec: item.restSec,
          sets: plannedSets(state, item.exerciseId, item.sets, item.reps),
        })),
      };
      return { ...state, active: workout };
    }

    case 'updateSet':
      return updateActive(state, (w) => ({
        ...w,
        exercises: w.exercises.map((e, i) =>
          i !== action.ex
            ? e
            : {
                ...e,
                sets: e.sets.map((s, j) =>
                  j === action.set ? { ...s, [action.field]: Math.max(0, sanitize(action.value)) } : s,
                ),
              },
        ),
      }));

    case 'toggleSet':
      return updateActive(state, (w) => ({
        ...w,
        exercises: w.exercises.map((e, i) =>
          i !== action.ex ? e : { ...e, sets: e.sets.map((s, j) => (j === action.set ? { ...s, done: !s.done } : s)) },
        ),
      }));

    case 'addSet':
      return updateActive(state, (w) => ({
        ...w,
        exercises: w.exercises.map((e, i) => {
          if (i !== action.ex) return e;
          const last = e.sets[e.sets.length - 1];
          return { ...e, sets: [...e.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 10, done: false }] };
        }),
      }));

    case 'removeSet':
      return updateActive(state, (w) => ({
        ...w,
        exercises: w.exercises.map((e, i) =>
          i !== action.ex ? e : { ...e, sets: e.sets.filter((_, j) => j !== action.set) },
        ),
      }));

    case 'addExercise':
      return updateActive(state, (w) => ({
        ...w,
        exercises: [
          ...w.exercises,
          { exerciseId: action.exerciseId, restSec: DEFAULT_REST, sets: plannedSets(state, action.exerciseId, 3, 0) },
        ],
      }));

    case 'removeExercise':
      return updateActive(state, (w) => ({ ...w, exercises: w.exercises.filter((_, i) => i !== action.ex) }));

    case 'finishWorkout': {
      if (!state.active) return state;
      // Solo se guardan las series marcadas como hechas.
      const exercises = state.active.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps > 0) }))
        .filter((e) => e.sets.length > 0);
      if (!exercises.length) return { ...state, active: null };
      const finished: Workout = { ...state.active, exercises, finishedAt: action.now };
      return { ...state, active: null, workouts: [...state.workouts, finished] };
    }

    case 'discardWorkout':
      return { ...state, active: null };

    case 'saveRoutine': {
      const exists = state.routines.some((r) => r.id === action.routine.id);
      return {
        ...state,
        routines: exists
          ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r))
          : [...state.routines, action.routine],
      };
    }

    case 'deleteRoutine':
      return { ...state, routines: state.routines.filter((r) => r.id !== action.id) };

    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };

    case 'clearSampleData':
      return { ...state, workouts: state.workouts.filter((w) => !w.sample) };

    case 'loadSampleData': {
      // Vuelve a cargar el ejemplo sin tocar los entrenos propios y recupera las rutinas de ejemplo borradas.
      const own = state.workouts.filter((w) => !w.sample);
      const workouts = [...createSampleWorkouts(action.now), ...own].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
      const missing = SAMPLE_ROUTINES.filter((r) => !state.routines.some((x) => x.id === r.id));
      return { ...state, workouts, routines: [...state.routines, ...missing] };
    }

    case 'replaceState':
      return action.state;
  }
}

function sanitize(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function hasSampleData(state: AppState): boolean {
  return state.workouts.some((w) => w.sample);
}
