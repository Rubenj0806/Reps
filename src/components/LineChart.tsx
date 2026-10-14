import { useState, type PointerEvent } from 'react';
import { useTapOutside } from '../hooks/useTapOutside';
import { useWidth } from '../hooks/useWidth';
import { shortDate } from '../lib/format';
import { linear, niceScale } from '../lib/scale';

export interface Point {
  date: string;
  value: number;
  note?: string;
}

interface Props {
  data: Point[];
  formatValue: (n: number) => string;
  label: string;
  height?: number;
}

const PAD = { top: 18, right: 18, bottom: 30, left: 48 };

/**
 * Gráfico de línea de una sola serie, con el eje X proporcional al tiempo.
 * Al pasar el ratón o tocar, muestra una línea guía y el valor exacto.
 */
export function LineChart({ data, formatValue, label, height = 240 }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  // En el móvil el detalle se queda al tocar y se quita tocando fuera de la gráfica.
  const outside = useTapOutside<HTMLDivElement>(hover !== null, () => setHover(null));

  if (!data.length) return null;

  const times = data.map((d) => new Date(d.date).getTime());
  const values = data.map((d) => d.value);
  const y = niceScale(Math.min(...values), Math.max(...values), 4);
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const sx =
    t0 === t1 ? () => PAD.left + innerW / 2 : linear(t0, t1, PAD.left, PAD.left + innerW);
  const sy = linear(y.min, y.max, height - PAD.bottom, PAD.top);
  const pts = data.map((d, i) => ({ x: sx(times[i]), y: sy(d.value), d }));
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${height - PAD.bottom} L${pts[0].x.toFixed(1)},${height - PAD.bottom} Z`;

  // Hasta 4 fechas en el eje X, repartidas entre los puntos reales.
  const labelIdx: number[] = [];
  for (const i of [0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1]) {
    const prev = labelIdx[labelIdx.length - 1];
    if (prev === undefined || (i !== prev && pts[i].x - pts[prev].x >= 84)) labelIdx.push(i);
  }
  // La última fecha siempre se ve: si choca con la anterior, sustituye a esa.
  if (labelIdx[labelIdx.length - 1] !== data.length - 1) {
    if (labelIdx.length > 1 && pts[data.length - 1].x - pts[labelIdx[labelIdx.length - 1]].x < 84) labelIdx.pop();
    labelIdx.push(data.length - 1);
  }

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * width;
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - px) < Math.abs(pts[best].x - px)) best = i;
    setHover(best);
  }

  const last = pts.length - 1;
  const h = hover !== null ? pts[hover] : null;

  return (
    <div className="chart" ref={outside}>
      <div ref={ref}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${label}: de ${formatValue(values[0])} a ${formatValue(values[last])}`}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
        >
          {y.ticks.map((t) => (
            <g key={t}>
              <line className="grid" x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} />
              <text className="axis" x={PAD.left - 8} y={sy(t)} dy="0.32em" textAnchor="end">
                {formatValue(t)}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text
              key={i}
              className="axis"
              x={pts[i].x}
              y={height - 8}
              textAnchor={i === 0 && data.length > 1 ? 'start' : i === last && data.length > 1 ? 'end' : 'middle'}
            >
              {shortDate(data[i].date)}
            </text>
          ))}
          <path className="area" d={area} />
          <path className="line" d={line} />
          {h && <line className="crosshair" x1={h.x} x2={h.x} y1={PAD.top} y2={height - PAD.bottom} />}
          {pts.map((p, i) => (
            <circle
              key={i}
              className={`dot ${i === last ? 'last' : ''} ${hover === i ? 'on' : ''}`}
              cx={p.x}
              cy={p.y}
              r={i === last || hover === i ? 5.5 : 4}
            />
          ))}
          {hover === null && (
            <text className="end-label" x={pts[last].x} y={pts[last].y - 12} textAnchor={data.length > 1 ? 'end' : 'middle'}>
              {formatValue(values[last])}
            </text>
          )}
        </svg>
      </div>
      {h && (
        <div
          className="tooltip"
          style={{
            left: Math.min(Math.max(h.x, 70), width - 70),
            top: Math.max(h.y - 12, 0),
          }}
        >
          <b>{formatValue(h.d.value)}</b>
          <span>{shortDate(h.d.date)}</span>
          {h.d.note && <span>{h.d.note}</span>}
        </div>
      )}
    </div>
  );
}
