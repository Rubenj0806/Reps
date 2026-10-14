import type { Exercise, MuscleGroup } from '../types';

export const EXERCISES: Exercise[] = [
  // Pecho
  { id: 'press-banca', name: 'Press de banca', muscle: 'pecho', equipment: 'barra' },
  { id: 'press-inclinado', name: 'Press inclinado con mancuernas', muscle: 'pecho', equipment: 'mancuernas' },
  { id: 'press-maquina', name: 'Press de pecho en máquina', muscle: 'pecho', equipment: 'máquina' },
  { id: 'aperturas-polea', name: 'Aperturas en polea', muscle: 'pecho', equipment: 'polea' },
  { id: 'fondos', name: 'Fondos en paralelas', muscle: 'pecho', equipment: 'peso corporal' },
  { id: 'flexiones', name: 'Flexiones', muscle: 'pecho', equipment: 'peso corporal' },
  // Espalda
  { id: 'dominadas', name: 'Dominadas', muscle: 'espalda', equipment: 'peso corporal' },
  { id: 'remo-barra', name: 'Remo con barra', muscle: 'espalda', equipment: 'barra' },
  { id: 'jalon-pecho', name: 'Jalón al pecho', muscle: 'espalda', equipment: 'polea' },
  { id: 'remo-mancuerna', name: 'Remo con mancuerna', muscle: 'espalda', equipment: 'mancuernas' },
  { id: 'remo-polea', name: 'Remo en polea baja', muscle: 'espalda', equipment: 'polea' },
  { id: 'peso-muerto', name: 'Peso muerto', muscle: 'espalda', equipment: 'barra' },
  // Piernas
  { id: 'sentadilla', name: 'Sentadilla', muscle: 'piernas', equipment: 'barra' },
  { id: 'prensa', name: 'Prensa de piernas', muscle: 'piernas', equipment: 'máquina' },
  { id: 'zancadas', name: 'Zancadas', muscle: 'piernas', equipment: 'mancuernas' },
  { id: 'extension-cuadriceps', name: 'Extensión de cuádriceps', muscle: 'piernas', equipment: 'máquina' },
  { id: 'curl-femoral', name: 'Curl femoral', muscle: 'piernas', equipment: 'máquina' },
  { id: 'peso-muerto-rumano', name: 'Peso muerto rumano', muscle: 'piernas', equipment: 'barra' },
  { id: 'gemelos', name: 'Elevación de gemelos', muscle: 'piernas', equipment: 'máquina' },
  // Glúteos
  { id: 'hip-thrust', name: 'Hip thrust', muscle: 'glúteos', equipment: 'barra' },
  { id: 'patada-polea', name: 'Patada de glúteo en polea', muscle: 'glúteos', equipment: 'polea' },
  { id: 'swing-kettlebell', name: 'Swing con kettlebell', muscle: 'glúteos', equipment: 'kettlebell' },
  // Hombros
  { id: 'press-militar', name: 'Press militar', muscle: 'hombros', equipment: 'barra' },
  { id: 'press-arnold', name: 'Press Arnold', muscle: 'hombros', equipment: 'mancuernas' },
  { id: 'elevaciones-laterales', name: 'Elevaciones laterales', muscle: 'hombros', equipment: 'mancuernas' },
  { id: 'face-pull', name: 'Face pull', muscle: 'hombros', equipment: 'polea' },
  // Brazos
  { id: 'curl-barra', name: 'Curl de bíceps con barra', muscle: 'brazos', equipment: 'barra' },
  { id: 'curl-martillo', name: 'Curl martillo', muscle: 'brazos', equipment: 'mancuernas' },
  { id: 'triceps-polea', name: 'Extensión de tríceps en polea', muscle: 'brazos', equipment: 'polea' },
  { id: 'press-frances', name: 'Press francés', muscle: 'brazos', equipment: 'barra' },
  // Core
  { id: 'crunch-polea', name: 'Crunch en polea', muscle: 'core', equipment: 'polea' },
  { id: 'elevaciones-piernas', name: 'Elevaciones de piernas colgado', muscle: 'core', equipment: 'peso corporal' },
  { id: 'rueda-abdominal', name: 'Rueda abdominal', muscle: 'core', equipment: 'peso corporal' },
];

export const MUSCLES: MuscleGroup[] = ['pecho', 'espalda', 'piernas', 'glúteos', 'hombros', 'brazos', 'core'];

const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  return byId.get(id) ?? { id, name: id, muscle: 'core', equipment: 'peso corporal' };
}

/** Busca sin distinguir mayúsculas ni tildes. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function searchExercises(query: string, muscle: MuscleGroup | null): Exercise[] {
  const q = normalize(query.trim());
  return EXERCISES.filter(
    (e) =>
      (!muscle || e.muscle === muscle) &&
      (!q || normalize(e.name).includes(q) || normalize(e.equipment).includes(q)),
  );
}
