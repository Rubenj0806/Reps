import { useState } from 'react';
import { useTapOutside } from '../hooks/useTapOutside';
import { useWidth } from '../hooks/useWidth';
import { shortDate, volume } from '../lib/format';
import type { WeekStat } from '../lib/stats';

const HEIGHT = 120;
const BOTTOM = 22;

/** Volumen por semana: barras finas con la semana actual destacada. */
export function WeekBars({ weeks }: { weeks: WeekStat[] }) {
  const [ref, width] = useWidth<HTMLDivElement>(320);
  const [hover, setHover] = useState<number | null>(null);
  // Con ratón el detalle sigue al puntero; en el móvil se queda fijo al tocar y se quita tocando fuera.
  const outside = useTapOutside<HTMLDivElement>(hover !== null, () => setHover(null));
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  const slot = width / weeks.length;
  const bw = Math.min(28, slot * 0.56);
  const chartH = HEIGHT - BOTTOM - 6;

  return (
    <div className="chart" ref={outside} onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}>
      <div ref={ref}>
        <svg width={width} height={HEIGHT} role="img" aria-label="Volumen levantado por semana, últimas 8 semanas">
          <line className="baseline" x1={0} x2={width} y1={HEIGHT - BOTTOM} y2={HEIGHT - BOTTOM} />
          {weeks.map((w, i) => {
            const bh = w.volume ? Math.max(3, (w.volume / max) * chartH) : 0;
            const x = i * slot + (slot - bw) / 2;
            const base = HEIGHT - BOTTOM;
            const top = base - bh;
            const r = Math.min(4, bh);
            const current = i === weeks.length - 1;
            return (
              <g
                key={i}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(i)}
                onPointerDown={(e) => setHover(e.pointerType !== 'mouse' && hover === i ? null : i)}
              >
                {/* área de toque más grande que la barra */}
                <rect x={i * slot} y={0} width={slot} height={HEIGHT} fill="transparent" />
                {bh > 0 && (
                  <path
                    className={`bar ${current ? 'current' : ''} ${hover === i ? 'on' : ''}`}
                    d={`M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z`}
                  />
                )}
                {(i % 2 === 1 || current) && (
                  <text className="axis" x={i * slot + slot / 2} y={HEIGHT - 6} textAnchor="middle">
                    {current ? 'Esta' : shortDate(w.start)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {hover !== null && (
        <div className="tooltip" style={{ left: Math.min(Math.max(hover * slot + slot / 2, 70), width - 70), top: 0 }}>
          <b>{volume(weeks[hover].volume)}</b>
          <span>
            Semana del {shortDate(weeks[hover].start)} · {weeks[hover].count}{' '}
            {weeks[hover].count === 1 ? 'entreno' : 'entrenos'}
          </span>
        </div>
      )}
    </div>
  );
}
