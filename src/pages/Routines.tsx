import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Confirm } from '../components/Modal';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { duration } from '../lib/format';
import { uid } from '../lib/id';
import { useStore } from '../state/store';
import type { Routine } from '../types';

/** Duración aproximada: unos 45 s por serie más el descanso entre series. */
export function estimateMinutes(r: Routine): number {
  const sec = r.items.reduce((sum, i) => sum + i.sets * (45 + i.restSec), 0);
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}

export function Routines() {
  const { state, dispatch } = useStore();
  const [toDelete, setToDelete] = useState<Routine | null>(null);

  function start(id: string) {
    dispatch({ type: 'startWorkout', routineId: id, id: uid('w-'), now: new Date().toISOString() });
    navigate('entreno');
  }

  return (
    <div className="page">
      <header className="page-head row">
        <div>
          <p className="eyebrow">Plantillas</p>
          <h1>Rutinas</h1>
        </div>
        <button type="button" className="btn primary" onClick={() => navigate('rutinas/nueva')}>
          <Icon name="plus" size={18} /> Nueva
        </button>
      </header>

      {!state.routines.length && (
        <div className="empty-state">
          <Icon name="list" size={28} />
          <p>Todavía no tienes rutinas. Crea una con los ejercicios que sueles hacer y empieza a entrenar con un toque.</p>
          <button type="button" className="btn primary" onClick={() => navigate('rutinas/nueva')}>
            Crear mi primera rutina
          </button>
        </div>
      )}

      <ul className="routine-list">
        {state.routines.map((r) => {
          const names = r.items.map((i) => getExercise(i.exerciseId).name);
          const sets = r.items.reduce((s, i) => s + i.sets, 0);
          return (
            <li key={r.id} className="card routine">
              <div className="routine-main">
                <h2>{r.name}</h2>
                <p className="muted">
                  {names.slice(0, 3).join(' · ')}
                  {names.length > 3 && ` y ${names.length - 3} más`}
                </p>
                <p className="meta">
                  <span>{r.items.length} ejercicios</span>
                  <span>{sets} series</span>
                  <span>≈ {duration(estimateMinutes(r))}</span>
                </p>
              </div>
              <div className="routine-actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => start(r.id)}
                  disabled={!!state.active || !r.items.length}
                  title={state.active ? 'Termina primero el entreno en curso' : undefined}
                >
                  <Icon name="play" size={16} /> Empezar
                </button>
                <button type="button" className="icon-btn" onClick={() => navigate(`rutinas/${r.id}`)} aria-label={`Editar ${r.name}`}>
                  <Icon name="edit" size={18} />
                </button>
                <button type="button" className="icon-btn" onClick={() => setToDelete(r)} aria-label={`Eliminar ${r.name}`}>
                  <Icon name="trash" size={18} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {toDelete && (
        <Confirm
          title="Eliminar rutina"
          message={`Se eliminará «${toDelete.name}». Los entrenos que ya hiciste con ella se conservan en el historial.`}
          confirmLabel="Eliminar"
          danger
          onCancel={() => setToDelete(null)}
          onConfirm={() => {
            dispatch({ type: 'deleteRoutine', id: toDelete.id });
            setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
