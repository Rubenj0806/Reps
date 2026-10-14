import { describe, expect, it } from 'vitest';
import type { Workout } from '../types';
import {
  estimate1RM,
  exerciseSessions,
  lastPerformance,
  newRecords,
  personalRecord,
  weekStart,
  weekStreak,
  weeklyStats,
  workoutVolume,
} from './stats';

function workout(id: string, date: string, exerciseId: string, sets: [number, number][], done = true): Workout {
  return {
    id,
    routineId: null,
    name: 'Prueba',
    startedAt: date,
    finishedAt: date,
    exercises: [{ exerciseId, restSec: 90, sets: sets.map(([weight, reps]) => ({ weight, reps, done })) }],
  };
}

describe('estimate1RM', () => {
  it('usa la fórmula de Epley', () => {
    expect(estimate1RM(100, 10)).toBeCloseTo(133.33, 1);
  });
  it('con una repetición devuelve el propio peso', () => {
    expect(estimate1RM(120, 1)).toBe(120);
  });
  it('devuelve 0 sin peso o sin repeticiones', () => {
    expect(estimate1RM(0, 10)).toBe(0);
    expect(estimate1RM(80, 0)).toBe(0);
  });
});

describe('volumen', () => {
  it('solo cuenta las series hechas', () => {
    const w = workout('a', '2026-10-01T18:00:00Z', 'press-banca', [[60, 10], [60, 8]]);
    w.exercises[0].sets.push({ weight: 100, reps: 10, done: false });
    expect(workoutVolume(w)).toBe(60 * 10 + 60 * 8);
  });
});

describe('sesiones y récords', () => {
  const history = [
    workout('a', '2026-09-01T18:00:00Z', 'sentadilla', [[80, 6], [80, 6]]),
    workout('b', '2026-09-08T18:00:00Z', 'sentadilla', [[85, 6], [85, 5]]),
    workout('c', '2026-09-15T18:00:00Z', 'sentadilla', [[90, 3]]),
  ];

  it('ordena las sesiones por fecha y calcula la mejor serie', () => {
    const sessions = exerciseSessions([...history].reverse(), 'sentadilla');
    expect(sessions.map((s) => s.workoutId)).toEqual(['a', 'b', 'c']);
    expect(sessions[1].best).toEqual({ weight: 85, reps: 6, done: true });
    expect(sessions[1].maxWeight).toBe(85);
  });

  it('el récord es el mayor 1RM estimado, no el mayor peso', () => {
    // 85 × 6 ≈ 102 kg de 1RM; 90 × 3 = 99 kg de 1RM.
    const pr = personalRecord(history, 'sentadilla');
    expect(pr?.set.weight).toBe(85);
    expect(pr?.metric).toBe('e1rm');
  });

  it('detecta un récord nuevo al comparar con el historial', () => {
    const today = workout('d', '2026-09-22T18:00:00Z', 'sentadilla', [[90, 6]]);
    expect(newRecords(history, today)).toEqual(['sentadilla']);
  });

  it('la primera vez que haces un ejercicio no cuenta como récord', () => {
    const first = workout('e', '2026-09-22T18:00:00Z', 'prensa', [[140, 10]]);
    expect(newRecords(history, first)).toEqual([]);
  });

  it('en ejercicios sin peso mide el récord por repeticiones', () => {
    const pullups = [
      workout('p1', '2026-09-01T18:00:00Z', 'dominadas', [[0, 5]]),
      workout('p2', '2026-09-08T18:00:00Z', 'dominadas', [[0, 7]]),
    ];
    expect(personalRecord(pullups, 'dominadas')).toMatchObject({ metric: 'maxReps', value: 7 });
  });

  it('propone los pesos de la última vez', () => {
    expect(lastPerformance(history, 'sentadilla')).toEqual([{ weight: 90, reps: 3, done: true }]);
    expect(lastPerformance(history, 'curl-barra')).toBeNull();
  });
});

describe('semanas', () => {
  it('la semana empieza el lunes', () => {
    // 15/10/2026 es jueves → la semana empieza el lunes 12.
    expect(weekStart(new Date(2026, 9, 15, 20)).getDate()).toBe(12);
    // Un domingo pertenece a la semana del lunes anterior.
    expect(weekStart(new Date(2026, 9, 18, 10)).getDate()).toBe(12);
  });

  it('agrupa entrenos y volumen por semana', () => {
    const now = new Date(2026, 9, 15, 12);
    const ws = [
      workout('1', new Date(2026, 9, 13, 18).toISOString(), 'press-banca', [[50, 10]]),
      workout('2', new Date(2026, 9, 6, 18).toISOString(), 'press-banca', [[50, 10]]),
    ];
    const weeks = weeklyStats(ws, now, 3);
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 1]);
    expect(weeks[2].volume).toBe(500);
  });

  it('cuenta la racha aunque esta semana aún no hayas entrenado', () => {
    const now = new Date(2026, 9, 12, 9); // lunes por la mañana
    const ws = [
      workout('1', new Date(2026, 9, 8, 18).toISOString(), 'press-banca', [[50, 10]]),
      workout('2', new Date(2026, 9, 1, 18).toISOString(), 'press-banca', [[50, 10]]),
      workout('3', new Date(2026, 8, 17, 18).toISOString(), 'press-banca', [[50, 10]]),
    ];
    expect(weekStreak(ws, now)).toBe(2);
  });
});
