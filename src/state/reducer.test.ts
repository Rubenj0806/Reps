import { describe, expect, it } from 'vitest';
import type { AppState } from '../types';
import { reducer } from './reducer';
import { createSampleState } from './sample';

const empty: AppState = {
  version: 1,
  active: null,
  routines: [{ id: 'r1', name: 'Pierna', items: [{ exerciseId: 'sentadilla', sets: 3, reps: 5, restSec: 120 }] }],
  workouts: [],
};

const start = (state: AppState, routineId: string | null = 'r1') =>
  reducer(state, { type: 'startWorkout', routineId, id: 'w1', now: '2026-10-14T18:00:00Z' });

describe('empezar un entreno', () => {
  it('crea las series de la rutina', () => {
    const s = start(empty);
    expect(s.active?.name).toBe('Pierna');
    expect(s.active?.exercises[0].sets).toHaveLength(3);
    expect(s.active?.exercises[0].sets[0]).toEqual({ weight: 0, reps: 5, done: false });
  });

  it('propone el peso de la última vez', () => {
    const withHistory: AppState = {
      ...empty,
      workouts: [
        {
          id: 'old',
          routineId: 'r1',
          name: 'Pierna',
          startedAt: '2026-10-10T18:00:00Z',
          finishedAt: '2026-10-10T19:00:00Z',
          exercises: [{ exerciseId: 'sentadilla', restSec: 120, sets: [{ weight: 100, reps: 5, done: true }] }],
        },
      ],
    };
    expect(start(withHistory).active?.exercises[0].sets.map((s) => s.weight)).toEqual([100, 100, 100]);
  });

  it('no deja empezar otro entreno si ya hay uno en curso', () => {
    const s = start(empty);
    const again = reducer(s, { type: 'startWorkout', routineId: null, id: 'w2', now: '2026-10-14T19:00:00Z' });
    expect(again.active?.id).toBe('w1');
  });
});

describe('terminar un entreno', () => {
  it('guarda solo las series marcadas como hechas', () => {
    let s = start(empty);
    s = reducer(s, { type: 'updateSet', ex: 0, set: 0, field: 'weight', value: 90 });
    s = reducer(s, { type: 'toggleSet', ex: 0, set: 0 });
    s = reducer(s, { type: 'finishWorkout', now: '2026-10-14T19:00:00Z' });
    expect(s.active).toBeNull();
    expect(s.workouts).toHaveLength(1);
    expect(s.workouts[0].exercises[0].sets).toEqual([{ weight: 90, reps: 5, done: true }]);
  });

  it('si no se hizo ninguna serie, no guarda nada', () => {
    const s = reducer(start(empty), { type: 'finishWorkout', now: '2026-10-14T19:00:00Z' });
    expect(s.workouts).toHaveLength(0);
    expect(s.active).toBeNull();
  });

  it('no acepta pesos negativos', () => {
    const s = reducer(start(empty), { type: 'updateSet', ex: 0, set: 0, field: 'weight', value: -20 });
    expect(s.active?.exercises[0].sets[0].weight).toBe(0);
  });
});

describe('datos de ejemplo', () => {
  it('genera entrenos terminados y ordenados', () => {
    const s = createSampleState(new Date(2026, 9, 14));
    expect(s.workouts.length).toBeGreaterThan(10);
    const dates = s.workouts.map((w) => w.startedAt);
    expect([...dates].sort()).toEqual(dates);
    expect(s.workouts.every((w) => w.sample && w.finishedAt)).toBe(true);
  });

  it('se pueden borrar sin tocar los entrenos propios', () => {
    let s = createSampleState(new Date(2026, 9, 14));
    s = start({ ...s, routines: [...s.routines, ...empty.routines] });
    s = reducer(s, { type: 'toggleSet', ex: 0, set: 0 });
    s = reducer(s, { type: 'finishWorkout', now: '2026-10-14T19:00:00Z' });
    s = reducer(s, { type: 'clearSampleData' });
    expect(s.workouts).toHaveLength(1);
    expect(s.workouts[0].sample).toBeUndefined();
  });

  it('se puede volver a cargar sin perder los entrenos propios', () => {
    let s = createSampleState(new Date(2026, 9, 14));
    const total = s.workouts.length;
    s = reducer(s, { type: 'clearSampleData' });
    s = reducer(s, { type: 'deleteRoutine', id: 'pierna' });
    s = reducer(s, { type: 'loadSampleData', now: new Date(2026, 9, 14) });
    expect(s.workouts).toHaveLength(total);
    expect(s.routines.some((r) => r.id === 'pierna')).toBe(true);
  });
});
