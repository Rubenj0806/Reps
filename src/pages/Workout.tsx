import { useCallback, useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { Icon } from '../components/Icon';
import { Confirm, Modal } from '../components/Modal';
import { NumberField } from '../components/NumberField';
import { RestTimer } from '../components/RestTimer';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { useNow } from '../hooks/useNow';
import { unlockAudio } from '../lib/alert';
import { clock, duration, setsSummary, volume } from '../lib/format';
import { uid } from '../lib/id';
import { lastPerformance, newRecords, workoutDurationMin, workoutSetCount, workoutVolume } from '../lib/stats';
import { useStore } from '../state/store';
import type { Workout as WorkoutType } from '../types';

interface Rest {
  endsAt: number;
  total: number;
  name: string;
}

interface Summary {
  workout: WorkoutType;
  records: string[];
}

export function Workout() {
  const { state, dispatch } = useStore();
  const active = state.active;
  const now = useNow(1000, !!active);
  const [rest, setRest] = useState<Rest | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const closeRest = useCallback(() => setRest(null), []);

  if (summary) return <WorkoutSummary summary={summary} />;

  if (!active) {
    return (
      <div className="page">
        <header className="page-head">
          <p className="eyebrow">Entreno</p>
          <h1>¿Qué toca hoy?</h1>
        </header>
        <div className="start-grid">
          {state.routines.map((r) => (
            <button
              key={r.id}
              type="button"
              className="card start"
              onClick={() => dispatch({ type: 'startWorkout', routineId: r.id, id: uid('w-'), now: new Date().toISOString() })}
            >
              <b>{r.name}</b>
              <small>{r.items.length} ejercicios</small>
              <span className="start-icon">
                <Icon name="play" size={18} />
              </span>
            </button>
          ))}
          <button
            type="button"
            className="card start free"
            onClick={() => dispatch({ type: 'startWorkout', routineId: null, id: uid('w-'), now: new Date().toISOString() })}
          >
            <b>Entreno libre</b>
            <small>Elige los ejercicios sobre la marcha</small>
            <span className="start-icon">
              <Icon name="plus" size={18} />
            </span>
          </button>
        </div>
      </div>
    );
  }

  const elapsed = (now.getTime() - new Date(active.startedAt).getTime()) / 1000;
  const totalSets = active.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneCount = active.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const pending = totalSets - doneCount;

  function toggle(ex: number, set: number) {
    const s = active!.exercises[ex].sets[set];
    dispatch({ type: 'toggleSet', ex, set });
    if (!s.done) {
      unlockAudio();
      const total = active!.exercises[ex].restSec;
      setRest({ endsAt: Date.now() + total * 1000, total, name: getExercise(active!.exercises[ex].exerciseId).name });
    }
  }

  function finish() {
    const done: WorkoutType = {
      ...active!,
      finishedAt: new Date().toISOString(),
      exercises: active!.exercises
        .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps > 0) }))
        .filter((e) => e.sets.length),
    };
    const records = newRecords(state.workouts, done);
    dispatch({ type: 'finishWorkout', now: done.finishedAt! });
    setConfirm(null);
    setRest(null);
    if (done.exercises.length) setSummary({ workout: done, records });
    else navigate('');
  }

  return (
    <div className="page workout">
      <header className="workout-head">
        <div>
          <p className="eyebrow">En curso</p>
          <h1>{active.name}</h1>
          <p className="meta">
            <span>
              <Icon name="timer" size={16} /> {clock(elapsed)}
            </span>
            <span>
              {doneCount}/{totalSets} series
            </span>
          </p>
        </div>
        <button type="button" className="btn primary" onClick={() => setConfirm('finish')} disabled={!doneCount}>
          Terminar
        </button>
      </header>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${totalSets ? (doneCount / totalSets) * 100 : 0}%` }} />
      </div>

      {!active.exercises.length && (
        <div className="empty-state">
          <Icon name="dumbbell" size={28} />
          <p>Añade el primer ejercicio para empezar a registrar series.</p>
        </div>
      )}

      {active.exercises.map((ex, i) => {
        const info = getExercise(ex.exerciseId);
        const last = lastPerformance(state.workouts, ex.exerciseId);
        const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.done);
        return (
          <section key={`${ex.exerciseId}-${i}`} className={`card exercise ${allDone ? 'complete' : ''}`}>
            <div className="exercise-head">
              <div>
                <h2>{info.name}</h2>
                <small className="muted">{last ? `Última vez: ${setsSummary(last)}` : `${info.muscle} · ${info.equipment}`}</small>
              </div>
              <button
                type="button"
                className="icon-btn sm"
                onClick={() => dispatch({ type: 'removeExercise', ex: i })}
                aria-label={`Quitar ${info.name}`}
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
            <table className="sets">
              <thead>
                <tr>
                  <th scope="col">Serie</th>
                  <th scope="col">Kg</th>
                  <th scope="col">Reps</th>
                  <th scope="col">
                    <span className="sr-only">Hecha</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((s, j) => (
                  <tr key={j} className={s.done ? 'done' : ''}>
                    <td className="set-n">
                      {j + 1}
                      {ex.sets.length > 1 && !s.done && (
                        <button
                          type="button"
                          className="remove-set"
                          onClick={() => dispatch({ type: 'removeSet', ex: i, set: j })}
                          aria-label={`Quitar serie ${j + 1}`}
                        >
                          <Icon name="x" size={12} />
                        </button>
                      )}
                    </td>
                    <td>
                      <NumberField
                        id={`w-${i}-${j}`}
                        label={`Peso de la serie ${j + 1}`}
                        decimals
                        value={s.weight}
                        onChange={(value) => dispatch({ type: 'updateSet', ex: i, set: j, field: 'weight', value })}
                      />
                    </td>
                    <td>
                      <NumberField
                        id={`r-${i}-${j}`}
                        label={`Repeticiones de la serie ${j + 1}`}
                        value={s.reps}
                        onChange={(value) => dispatch({ type: 'updateSet', ex: i, set: j, field: 'reps', value })}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="check"
                        aria-pressed={s.done}
                        aria-label={`Marcar serie ${j + 1} como hecha`}
                        onClick={() => toggle(i, j)}
                        disabled={!s.reps}
                      >
                        <Icon name="check" size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn ghost sm add-set" onClick={() => dispatch({ type: 'addSet', ex: i })}>
              <Icon name="plus" size={16} /> Añadir serie
            </button>
          </section>
        );
      })}

      <button type="button" className="btn dashed" onClick={() => setPicking(true)}>
        <Icon name="plus" size={18} /> Añadir ejercicio
      </button>
      <button type="button" className="btn ghost danger-text" onClick={() => setConfirm('discard')}>
        Descartar entreno
      </button>

      {rest && (
        <RestTimer
          endsAt={rest.endsAt}
          total={rest.total}
          exerciseName={rest.name}
          onClose={closeRest}
          onAdjust={(d) => setRest((r) => (r ? { ...r, endsAt: Math.max(Date.now(), r.endsAt + d * 1000), total: Math.max(1, r.total + d) } : r))}
        />
      )}

      {picking && (
        <ExercisePicker
          exclude={active.exercises.map((e) => e.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => {
            dispatch({ type: 'addExercise', exerciseId });
            setPicking(false);
          }}
        />
      )}

      {confirm === 'finish' && (
        <Confirm
          title="Terminar entreno"
          message={
            pending
              ? `Tienes ${pending} ${pending === 1 ? 'serie' : 'series'} sin marcar. Solo se guardarán las series hechas.`
              : 'Se guardará en tu historial con todas las series que has hecho.'
          }
          confirmLabel="Terminar y guardar"
          onCancel={() => setConfirm(null)}
          onConfirm={finish}
        />
      )}
      {confirm === 'discard' && (
        <Confirm
          title="Descartar entreno"
          message="Se borrará este entreno y no se guardará ninguna serie. No se puede deshacer."
          confirmLabel="Descartar"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            dispatch({ type: 'discardWorkout' });
            setConfirm(null);
            setRest(null);
            navigate('');
          }}
        />
      )}
    </div>
  );
}

function WorkoutSummary({ summary }: { summary: Summary }) {
  const { workout, records } = summary;
  return (
    <div className="page">
      <Modal title="¡Entreno completado!" onClose={() => navigate('')} footer={
        <>
          <button type="button" className="btn ghost" onClick={() => navigate('historial')}>
            Ver historial
          </button>
          <button type="button" className="btn primary" onClick={() => navigate('')}>
            Ir al inicio
          </button>
        </>
      }>
        <div className="summary">
          <p className="summary-name">{workout.name}</p>
          <div className="tiles">
            <div className="tile">
              <small>Duración</small>
              <b>{duration(workoutDurationMin(workout))}</b>
            </div>
            <div className="tile">
              <small>Series</small>
              <b>{workoutSetCount(workout)}</b>
            </div>
            <div className="tile">
              <small>Volumen</small>
              <b>{volume(workoutVolume(workout))}</b>
            </div>
          </div>
          {records.length > 0 ? (
            <div className="summary-records">
              <p>
                <Icon name="trophy" size={18} /> <b>{records.length === 1 ? 'Nuevo récord' : `${records.length} nuevos récords`}</b>
              </p>
              <ul>
                {records.map((id) => (
                  <li key={id}>{getExercise(id).name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="muted">Buen trabajo. La constancia es lo que hace subir los números.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
