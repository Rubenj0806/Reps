import { useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { Icon } from '../components/Icon';
import { Stepper } from '../components/Stepper';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { clock } from '../lib/format';
import { uid } from '../lib/id';
import { useStore } from '../state/store';
import type { Routine, RoutineItem } from '../types';

export function RoutineEditor({ routineId }: { routineId: string }) {
  const { state, dispatch } = useStore();
  const existing = state.routines.find((r) => r.id === routineId);
  const [draft, setDraft] = useState<Routine>(() => existing ?? { id: uid('r-'), name: '', items: [] });
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');

  if (routineId !== 'nueva' && !existing) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Esta rutina ya no existe.</p>
          <button type="button" className="btn primary" onClick={() => navigate('rutinas')}>
            Volver a rutinas
          </button>
        </div>
      </div>
    );
  }

  const updateItem = (index: number, patch: Partial<RoutineItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));

  const move = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      const items = [...d.items];
      const target = index + dir;
      if (target < 0 || target >= items.length) return d;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...d, items };
    });

  function save() {
    const name = draft.name.trim();
    if (!name) return setError('Ponle un nombre a la rutina, por ejemplo «Pierna» o «Torso A».');
    if (!draft.items.length) return setError('Añade al menos un ejercicio.');
    dispatch({ type: 'saveRoutine', routine: { ...draft, name } });
    navigate('rutinas');
  }

  return (
    <div className="page">
      <header className="page-head">
        <button type="button" className="link back" onClick={() => navigate('rutinas')}>
          <Icon name="back" size={18} /> Rutinas
        </button>
        <h1>{existing ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </header>

      <label className="field">
        <span>Nombre</span>
        <input
          id="routine-name"
          value={draft.name}
          maxLength={40}
          placeholder="Por ejemplo, Torso A"
          onChange={(e) => {
            setDraft({ ...draft, name: e.target.value });
            setError('');
          }}
        />
      </label>

      <ol className="editor-list">
        {draft.items.map((item, i) => (
          <li key={`${item.exerciseId}-${i}`} className="card editor-item">
            <div className="editor-top">
              <span className="index">{i + 1}</span>
              <b>{getExercise(item.exerciseId).name}</b>
              <div className="editor-order">
                <button type="button" className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">
                  <Icon name="up" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => move(i, 1)}
                  disabled={i === draft.items.length - 1}
                  aria-label="Bajar"
                >
                  <Icon name="down" size={16} />
                </button>
                <button
                  type="button"
                  className="icon-btn sm"
                  onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((_, j) => j !== i) }))}
                  aria-label={`Quitar ${getExercise(item.exerciseId).name}`}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
            <div className="editor-steppers">
              <Stepper id={`sets-${i}`} label="Series" value={item.sets} min={1} max={10} onChange={(n) => updateItem(i, { sets: n })} />
              <Stepper id={`reps-${i}`} label="Reps" value={item.reps} min={1} max={50} onChange={(n) => updateItem(i, { reps: n })} />
              <Stepper
                id={`rest-${i}`}
                label="Descanso"
                value={item.restSec}
                min={15}
                max={300}
                step={15}
                format={clock}
                onChange={(n) => updateItem(i, { restSec: n })}
              />
            </div>
          </li>
        ))}
      </ol>

      <button type="button" className="btn dashed" onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} /> Añadir ejercicio
      </button>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="sticky-actions">
        <button type="button" className="btn ghost" onClick={() => navigate('rutinas')}>
          Cancelar
        </button>
        <button type="button" className="btn primary" onClick={save}>
          Guardar rutina
        </button>
      </div>

      {picking && (
        <ExercisePicker
          exclude={draft.items.map((i) => i.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => {
            setDraft((d) => ({ ...d, items: [...d.items, { exerciseId, sets: 3, reps: 10, restSec: 90 }] }));
            setPicking(false);
            setError('');
          }}
        />
      )}
    </div>
  );
}
