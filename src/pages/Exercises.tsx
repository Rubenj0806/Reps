import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { MUSCLES, searchExercises } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { num } from '../lib/format';
import { exerciseSessions, personalRecord } from '../lib/stats';
import { useStore } from '../state/store';
import type { MuscleGroup } from '../types';

export function Exercises() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const results = useMemo(() => searchExercises(query, muscle), [query, muscle]);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Catálogo</p>
        <h1>Ejercicios</h1>
      </header>

      <label className="search">
        <Icon name="search" size={18} />
        <input
          id="exercise-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca por nombre o material"
          aria-label="Buscar ejercicio"
        />
      </label>
      <div className="chips" role="group" aria-label="Grupo muscular">
        <button type="button" className="chip" aria-pressed={muscle === null} onClick={() => setMuscle(null)}>
          Todos
        </button>
        {MUSCLES.map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={muscle === m} onClick={() => setMuscle(m)}>
            {m}
          </button>
        ))}
      </div>

      <p className="result-count">
        {results.length} {results.length === 1 ? 'ejercicio' : 'ejercicios'}
      </p>
      <ul className="exercise-list">
        {results.map((e) => {
          const sessions = exerciseSessions(state.workouts, e.id);
          const pr = personalRecord(state.workouts, e.id);
          return (
            <li key={e.id}>
              <button
                type="button"
                className="exercise-row"
                disabled={!sessions.length}
                onClick={() => navigate(`progreso/${e.id}`)}
              >
                <span className="exercise-name">
                  <b>{e.name}</b>
                  <small>
                    {e.muscle} · {e.equipment}
                  </small>
                </span>
                <span className="exercise-stat">
                  {pr ? (
                    <>
                      <b>{pr.metric === 'maxReps' ? `${pr.value} reps` : `${num(pr.value)} kg`}</b>
                      <small>
                        {sessions.length} {sessions.length === 1 ? 'sesión' : 'sesiones'}
                      </small>
                    </>
                  ) : (
                    <small className="muted">Sin registros</small>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {!results.length && <li className="empty">No hay ejercicios que coincidan con «{query}».</li>}
      </ul>
    </div>
  );
}
