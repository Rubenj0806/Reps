import { useMemo } from 'react';
import { Icon } from '../components/Icon';
import { InstallCard } from '../components/InstallCard';
import { WeekBars } from '../components/WeekBars';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { useNow } from '../hooks/useNow';
import { duration, longDate, num, shortDate, volume } from '../lib/format';
import { uid } from '../lib/id';
import {
  personalRecord,
  trainedExercises,
  weekStreak,
  weeklyStats,
  workoutDurationMin,
  workoutSetCount,
  workoutVolume,
} from '../lib/stats';
import { hasSampleData } from '../state/reducer';
import { useStore } from '../state/store';

function greeting(d: Date): string {
  const h = d.getHours();
  return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
}

export function Home() {
  const { state, dispatch } = useStore();
  const now = useNow(60_000);
  const weeks = useMemo(() => weeklyStats(state.workouts, now, 8), [state.workouts, now]);
  const thisWeek = weeks[weeks.length - 1];
  const streak = weekStreak(state.workouts, now);
  const last = state.workouts[state.workouts.length - 1];

  // Récords conseguidos en las últimas dos semanas.
  const recentRecords = useMemo(() => {
    const since = now.getTime() - 14 * 86400000;
    return trainedExercises(state.workouts)
      .map((id) => ({ id, pr: personalRecord(state.workouts, id) }))
      .filter((r) => r.pr && new Date(r.pr.date).getTime() >= since && r.pr.metric === 'e1rm')
      .slice(0, 3);
  }, [state.workouts, now]);

  function start(routineId: string | null) {
    dispatch({ type: 'startWorkout', routineId, id: uid('w-'), now: new Date().toISOString() });
    navigate('entreno');
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">{longDate(now)}</p>
        <h1>{greeting(now)}</h1>
      </header>

      {hasSampleData(state) && (
        <div className="notice" role="note">
          <p>
            Estás viendo <b>datos de ejemplo</b> de seis semanas para que veas cómo funciona. Tus entrenos se guardan
            en este dispositivo.
          </p>
          <button type="button" className="btn sm ghost" onClick={() => dispatch({ type: 'clearSampleData' })}>
            Borrar ejemplo
          </button>
        </div>
      )}

      {!hasSampleData(state) && (
        <div className="notice" role="note">
          <p>
            {state.workouts.length
              ? 'Puedes añadir datos de ejemplo para ver cómo quedan las gráficas con más semanas. Tus entrenos no se tocan.'
              : 'Aún no tienes entrenos. Empieza uno o carga el ejemplo para ver cómo quedan las gráficas y el historial.'}
          </p>
          <button type="button" className="btn sm ghost" onClick={() => dispatch({ type: 'loadSampleData', now: new Date() })}>
            Cargar ejemplo
          </button>
        </div>
      )}

      <InstallCard />

      {state.active && (
        <button type="button" className="card resume" onClick={() => navigate('entreno')}>
          <span className="pulse" aria-hidden="true" />
          <span>
            <small>Entreno en curso</small>
            <b>{state.active.name}</b>
          </span>
          <span className="resume-cta">
            Continuar <Icon name="play" size={16} />
          </span>
        </button>
      )}

      <section className="card week">
        <div className="tiles">
          <div className="tile">
            <small>Esta semana</small>
            <b>{thisWeek.count}</b>
            <span>{thisWeek.count === 1 ? 'entreno' : 'entrenos'}</span>
          </div>
          <div className="tile">
            <small>Volumen</small>
            <b>{volume(thisWeek.volume)}</b>
            <span>levantados</span>
          </div>
          <div className="tile">
            <small>Racha</small>
            <b>
              {streak} <Icon name="flame" size={18} />
            </b>
            <span>{streak === 1 ? 'semana' : 'semanas'}</span>
          </div>
        </div>
        <h2 className="section-label">Volumen por semana</h2>
        <WeekBars weeks={weeks} />
      </section>

      {!state.active && (
        <section>
          <div className="section-head">
            <h2>Empezar a entrenar</h2>
            <button type="button" className="link" onClick={() => navigate('rutinas')}>
              Ver rutinas
            </button>
          </div>
          <div className="start-grid">
            {state.routines.map((r) => (
              <button key={r.id} type="button" className="card start" onClick={() => start(r.id)}>
                <b>{r.name}</b>
                <small>{r.items.length} ejercicios</small>
                <span className="start-icon">
                  <Icon name="play" size={18} />
                </span>
              </button>
            ))}
            <button type="button" className="card start free" onClick={() => start(null)}>
              <b>Entreno libre</b>
              <small>Elige los ejercicios sobre la marcha</small>
              <span className="start-icon">
                <Icon name="plus" size={18} />
              </span>
            </button>
          </div>
        </section>
      )}

      {recentRecords.length > 0 && (
        <section>
          <h2>Récords recientes</h2>
          <ul className="records">
            {recentRecords.map(({ id, pr }) => (
              <li key={id}>
                <button type="button" className="record" onClick={() => navigate(`progreso/${id}`)}>
                  <Icon name="trophy" size={20} />
                  <span>
                    <b>{getExercise(id).name}</b>
                    <small>
                      {num(pr!.set.weight)} kg × {pr!.set.reps} · {shortDate(pr!.date)}
                    </small>
                  </span>
                  <span className="record-value">
                    {num(pr!.value)} <small>kg 1RM</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {last && (
        <section>
          <h2>Último entreno</h2>
          <button type="button" className="card last" onClick={() => navigate('historial')}>
            <span>
              <b>{last.name}</b>
              <small>{shortDate(last.startedAt)}</small>
            </span>
            <span className="last-stats">
              <span>{duration(workoutDurationMin(last))}</span>
              <span>{workoutSetCount(last)} series</span>
              <span>{volume(workoutVolume(last))}</span>
            </span>
          </button>
        </section>
      )}
    </div>
  );
}
