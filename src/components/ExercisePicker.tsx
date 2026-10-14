import { useMemo, useState } from 'react';
import { MUSCLES, searchExercises } from '../data/exercises';
import type { MuscleGroup } from '../types';
import { Icon } from './Icon';
import { Modal } from './Modal';

interface Props {
  onPick: (exerciseId: string) => void;
  onClose: () => void;
  exclude?: string[];
}

export function ExercisePicker({ onPick, onClose, exclude = [] }: Props) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const results = useMemo(() => searchExercises(query, muscle), [query, muscle]);

  return (
    <Modal title="Añadir ejercicio" onClose={onClose}>
      <label className="search">
        <Icon name="search" size={18} />
        <input
          id="picker-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un ejercicio o material"
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
      <ul className="pick-list">
        {results.map((e) => {
          const added = exclude.includes(e.id);
          return (
            <li key={e.id}>
              <button type="button" className="pick-row" disabled={added} onClick={() => onPick(e.id)}>
                <span>
                  <b>{e.name}</b>
                  <small>
                    {e.muscle} · {e.equipment}
                  </small>
                </span>
                {added ? <small className="muted">Añadido</small> : <Icon name="plus" size={18} />}
              </button>
            </li>
          );
        })}
        {!results.length && <li className="empty">No hay ejercicios que coincidan con «{query}».</li>}
      </ul>
    </Modal>
  );
}
