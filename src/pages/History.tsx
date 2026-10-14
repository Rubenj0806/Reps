import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Confirm } from '../components/Modal';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { dayLabel, duration, monthLabel, setsSummary, volume } from '../lib/format';
import { doneSets, workoutDurationMin, workoutSetCount, workoutVolume } from '../lib/stats';
import { useStore } from '../state/store';
import type { Workout } from '../types';

export function History() {
  const { state, dispatch } = useStore();
  const [toDelete, setToDelete] = useState<Workout | null>(null);
  const workouts = [...state.workouts].reverse();

  // Agrupa por mes, del más reciente al más antiguo.
  const groups: { month: string; items: Workout[] }[] = [];
  for (const w of workouts) {
    const month = monthLabel(w.startedAt);
    const group = groups[groups.length - 1];
    if (group?.month === month) group.items.push(w);
    else groups.push({ month, items: [w] });
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">{workouts.length} entrenos</p>
        <h1>Historial</h1>
      </header>

      {!workouts.length && (
        <div className="empty-state">
          <Icon name="history" size={28} />
          <p>Aquí aparecerán tus entrenos cuando termines el primero.</p>
          <button type="button" className="btn primary" onClick={() => navigate('entreno')}>
            Empezar a entrenar
          </button>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.month}>
          <h2 className="section-label">{g.month}</h2>
          <ul className="history-list">
            {g.items.map((w) => (
              <li key={w.id}>
                <details className="card history-item">
                  <summary>
                    <span className="history-date">{dayLabel(w.startedAt)}</span>
                    <span className="history-main">
                      <b>
                        {w.name}
                        {w.sample && <span className="tag">Ejemplo</span>}
                      </b>
                      <small>
                        {duration(workoutDurationMin(w))} · {workoutSetCount(w)} series · {volume(workoutVolume(w))}
                      </small>
                    </span>
                    <Icon name="down" size={18} />
                  </summary>
                  <ul className="history-detail">
                    {w.exercises.map((e, i) => (
                      <li key={i}>
                        <button type="button" className="link" onClick={() => navigate(`progreso/${e.exerciseId}`)}>
                          {getExercise(e.exerciseId).name}
                        </button>
                        <span>{setsSummary(doneSets(e))}</span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="btn ghost sm danger-text" onClick={() => setToDelete(w)}>
                    <Icon name="trash" size={16} /> Eliminar entreno
                  </button>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {toDelete && (
        <Confirm
          title="Eliminar entreno"
          message={`Se borrará el entreno «${toDelete.name}» del ${dayLabel(toDelete.startedAt)} y sus series dejarán de contar en tu progreso.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            dispatch({ type: 'deleteWorkout', id: toDelete.id });
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
