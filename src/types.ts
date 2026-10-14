export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'piernas'
  | 'glúteos'
  | 'hombros'
  | 'brazos'
  | 'core';

export type Equipment =
  | 'barra'
  | 'mancuernas'
  | 'máquina'
  | 'polea'
  | 'peso corporal'
  | 'kettlebell';

export interface Exercise {
  id: string;
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
}

/** Un ejercicio dentro de una rutina (la plantilla). */
export interface RoutineItem {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  items: RoutineItem[];
}

/** Una serie realizada (o por realizar) dentro de un entreno. */
export interface SetLog {
  weight: number;
  reps: number;
  done: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  restSec: number;
  sets: SetLog[];
}

export interface Workout {
  id: string;
  routineId: string | null;
  name: string;
  startedAt: string; // ISO
  finishedAt: string | null; // ISO, null mientras está en curso
  exercises: WorkoutExercise[];
  /** Marca los entrenos de ejemplo que se cargan la primera vez. */
  sample?: boolean;
}

export interface AppState {
  version: 1;
  routines: Routine[];
  workouts: Workout[]; // solo entrenos terminados, del más antiguo al más reciente
  active: Workout | null;
}

export type Metric = 'e1rm' | 'maxWeight' | 'volume' | 'maxReps';
