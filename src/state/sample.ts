import type { AppState, Routine, Workout } from '../types';

/**
 * Datos de ejemplo para que la app no se vea vacía la primera vez.
 * Se generan de forma determinista: seis semanas de progresión realista.
 */
export const SAMPLE_ROUTINES: Routine[] = [
  {
    id: 'torso-a',
    name: 'Torso A',
    items: [
      { exerciseId: 'press-banca', sets: 4, reps: 8, restSec: 150 },
      { exerciseId: 'remo-barra', sets: 4, reps: 8, restSec: 120 },
      { exerciseId: 'press-militar', sets: 3, reps: 10, restSec: 120 },
      { exerciseId: 'jalon-pecho', sets: 3, reps: 10, restSec: 90 },
      { exerciseId: 'curl-barra', sets: 3, reps: 12, restSec: 60 },
      { exerciseId: 'triceps-polea', sets: 3, reps: 12, restSec: 60 },
    ],
  },
  {
    id: 'pierna',
    name: 'Pierna',
    items: [
      { exerciseId: 'sentadilla', sets: 4, reps: 6, restSec: 180 },
      { exerciseId: 'peso-muerto-rumano', sets: 3, reps: 8, restSec: 150 },
      { exerciseId: 'prensa', sets: 3, reps: 10, restSec: 120 },
      { exerciseId: 'curl-femoral', sets: 3, reps: 12, restSec: 75 },
      { exerciseId: 'gemelos', sets: 4, reps: 15, restSec: 60 },
    ],
  },
  {
    id: 'torso-b',
    name: 'Torso B',
    items: [
      { exerciseId: 'press-inclinado', sets: 4, reps: 10, restSec: 120 },
      { exerciseId: 'dominadas', sets: 4, reps: 8, restSec: 120 },
      { exerciseId: 'elevaciones-laterales', sets: 3, reps: 15, restSec: 60 },
      { exerciseId: 'remo-polea', sets: 3, reps: 12, restSec: 90 },
      { exerciseId: 'curl-martillo', sets: 3, reps: 12, restSec: 60 },
      { exerciseId: 'face-pull', sets: 3, reps: 15, restSec: 60 },
    ],
  },
];

/** Peso de partida y subida por semana de cada ejercicio (kg). Peso 0 = peso corporal. */
const PROGRESSION: Record<string, [start: number, perWeek: number]> = {
  'press-banca': [60, 2.5],
  'remo-barra': [55, 2.5],
  'press-militar': [35, 1.25],
  'jalon-pecho': [50, 2.5],
  'curl-barra': [25, 1.25],
  'triceps-polea': [22.5, 1.25],
  sentadilla: [80, 5],
  'peso-muerto-rumano': [70, 2.5],
  prensa: [140, 10],
  'curl-femoral': [35, 2.5],
  gemelos: [60, 5],
  'press-inclinado': [22, 1],
  dominadas: [0, 0],
  'elevaciones-laterales': [8, 0.5],
  'remo-polea': [50, 2.5],
  'curl-martillo': [14, 1],
  'face-pull': [20, 1.25],
};

// Generador pseudoaleatorio con semilla para que el ejemplo sea siempre igual.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function createSampleWorkouts(now: Date, weeks = 6): Workout[] {
  const rand = seeded(42);
  const workouts: Workout[] = [];
  const order = ['torso-a', 'pierna', 'torso-b'];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let session = 0;

  for (let week = weeks - 1; week >= 0; week--) {
    for (const dayOffset of [0, 2, 4]) {
      // Lunes, miércoles y viernes de semanas anteriores.
      const date = new Date(today);
      const monday = (date.getDay() + 6) % 7;
      date.setDate(date.getDate() - monday - week * 7 + dayOffset);
      if (date.getTime() >= today.getTime()) continue; // nada en el futuro ni hoy
      if (rand() < 0.12) continue; // algún día que se salta, como en la vida real
      date.setHours(18 + Math.floor(rand() * 2), Math.floor(rand() * 60));

      const routine = SAMPLE_ROUTINES.find((r) => r.id === order[session % 3]) as Routine;
      session++;
      const weekIndex = weeks - 1 - week;
      const minutes = 48 + Math.floor(rand() * 25);

      workouts.push({
        id: `ejemplo-${session}`,
        routineId: routine.id,
        name: routine.name,
        startedAt: date.toISOString(),
        finishedAt: new Date(date.getTime() + minutes * 60000).toISOString(),
        sample: true,
        exercises: routine.items.map((item) => {
          const [start, perWeek] = PROGRESSION[item.exerciseId] ?? [20, 1];
          const step = start >= 40 ? 2.5 : 1;
          const weight = start === 0 ? 0 : roundTo(start + perWeek * weekIndex - (rand() < 0.2 ? perWeek : 0), step);
          return {
            exerciseId: item.exerciseId,
            restSec: item.restSec,
            sets: Array.from({ length: item.sets }, (_, i) => {
              const fatigue = i >= item.sets - 1 && rand() < 0.4 ? 1 : 0;
              const bodyweightReps = 5 + Math.floor(weekIndex / 2) - (i > 1 ? 1 : 0);
              return {
                weight,
                reps: start === 0 ? Math.max(3, bodyweightReps) : Math.max(1, item.reps - fatigue),
                done: true,
              };
            }),
          };
        }),
      });
    }
  }
  return workouts;
}

export function createSampleState(now: Date): AppState {
  return { version: 1, routines: SAMPLE_ROUTINES, workouts: createSampleWorkouts(now), active: null };
}
