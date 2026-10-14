import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { LineChart } from '../components/LineChart';
import { getExercise } from '../data/exercises';
import { navigate } from '../hooks/useRoute';
import { kg, num, shortDate, volume } from '../lib/format';
import { exerciseSessions, isBodyweightHistory, personalRecord, trainedExercises } from '../lib/stats';
import { useStore } from '../state/store';
import type { Metric } from '../types';

const METRICS: { id: Metric; label: string; help: string }[] = [
  { id: 'e1rm', label: '1RM est.', help: 'El peso máximo que podrías levantar una vez, calculado a partir de tu mejor serie (fórmula de Epley).' },
  { id: 'maxWeight', label: 'Peso máx.', help: 'El mayor peso que usaste en el ejercicio ese día.' },
  { id: 'volume', label: 'Volumen', help: 'Peso × repeticiones de todas las series del ejercicio ese día.' },
];

export function Progress({ exerciseId }: { exerciseId?: string }) {
  const { state } = useStore();
  const trained = useMemo(() => trainedExercises(state.workouts), [state.workouts]);
  const selected = exerciseId && trained.includes(exerciseId) ? exerciseId : trained[0];
  const [metric, setMetric] = useState<Metric>('e1rm');
  const [asTable, setAsTable] = useState(false);

  const sessions = useMemo(
    () => (selected ? exerciseSessions(state.workouts, selected) : []),
    [state.workouts, selected],
  );

  if (!selected) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Progreso</h1>
        </header>
        <div className="empty-state">
          <Icon name="chart" size={28} />
          <p>Cuando termines algunos entrenos, aquí verás cómo evolucionan tus marcas en cada ejercicio.</p>
        </div>
      </div>
    );
  }

  const bodyweight = isBodyweightHistory(sessions);
  const activeMetric: Metric = bodyweight ? 'maxReps' : metric;
  const fmt = activeMetric === 'maxReps' ? (n: number) => `${num(n)} reps` : activeMetric === 'volume' ? volume : kg;
  const pr = personalRecord(state.workouts, selected);
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const change = first && last && first[activeMetric] ? ((last[activeMetric] - first[activeMetric]) / first[activeMetric]) * 100 : 0;
  const metricInfo = METRICS.find((m) => m.id === activeMetric);

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Progreso</p>
        <label className="select">
          <span className="sr-only">Ejercicio</span>
          <select id="exercise-select" value={selected} onChange={(e) => navigate(`progreso/${e.target.value}`)}>
            {trained.map((id) => (
              <option key={id} value={id}>
                {getExercise(id).name}
              </option>
            ))}
          </select>
          <Icon name="down" size={18} />
        </label>
      </header>

      <div className="tiles three">
        <div className="tile">
          <small>Récord</small>
          <b>{pr ? fmt(pr.value) : '—'}</b>
          <span>{pr && !bodyweight ? `${num(pr.set.weight)} kg × ${pr.set.reps}` : pr ? shortDate(pr.date) : ''}</span>
        </div>
        <div className="tile">
          <small>Evolución</small>
          <b className={change > 0 ? 'up' : undefined}>
            {change > 0 ? '+' : ''}
            {num(change)} %
          </b>
          <span>desde {first ? shortDate(first.date) : '—'}</span>
        </div>
        <div className="tile">
          <small>Sesiones</small>
          <b>{sessions.length}</b>
          <span>registradas</span>
        </div>
      </div>

      <section className="card">
        <div className="chart-head">
          {!bodyweight ? (
            <div className="segmented" role="group" aria-label="Qué medir">
              {METRICS.map((m) => (
                <button key={m.id} type="button" aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="chart-title">Repeticiones máximas por sesión</p>
          )}
          <button
            type="button"
            className="icon-btn sm"
            aria-pressed={asTable}
            onClick={() => setAsTable((v) => !v)}
            aria-label={asTable ? 'Ver como gráfico' : 'Ver como tabla'}
            title={asTable ? 'Ver como gráfico' : 'Ver como tabla'}
          >
            <Icon name={asTable ? 'chart' : 'table'} size={18} />
          </button>
        </div>

        {asTable ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Mejor serie</th>
                  <th scope="col">{bodyweight ? 'Reps' : metricInfo?.label}</th>
                </tr>
              </thead>
              <tbody>
                {[...sessions].reverse().map((s) => (
                  <tr key={s.workoutId}>
                    <td>{shortDate(s.date)}</td>
                    <td>{s.best ? (bodyweight ? `${s.maxReps} reps` : `${num(s.best.weight)} kg × ${s.best.reps}`) : '—'}</td>
                    <td className="num">{fmt(s[activeMetric])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <LineChart
            label={`${getExercise(selected).name}, ${bodyweight ? 'repeticiones máximas' : metricInfo?.label}`}
            formatValue={fmt}
            data={sessions.map((s) => ({
              date: s.date,
              value: s[activeMetric],
              note: s.best && !bodyweight ? `Mejor serie: ${num(s.best.weight)} kg × ${s.best.reps}` : undefined,
            }))}
          />
        )}
        {metricInfo && !bodyweight && <p className="help">{metricInfo.help}</p>}
        {sessions.length === 1 && <p className="help">Con un solo entreno aún no hay evolución que mostrar. ¡Vuelve después del próximo!</p>}
      </section>
    </div>
  );
}
