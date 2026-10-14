import { useEffect, useRef } from 'react';
import { useNow } from '../hooks/useNow';
import { restFinishedAlert } from '../lib/alert';
import { clock } from '../lib/format';

interface Props {
  endsAt: number;
  total: number;
  exerciseName: string;
  onAdjust: (deltaSec: number) => void;
  onClose: () => void;
}

/** Cuenta atrás del descanso entre series, fija abajo de la pantalla. */
export function RestTimer({ endsAt, total, exerciseName, onAdjust, onClose }: Props) {
  const now = useNow(250).getTime();
  const left = Math.max(0, (endsAt - now) / 1000);
  const finished = left <= 0;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Al llegar a cero: aviso (vibración + pitido) y se cierra solo a los 4 segundos.
  useEffect(() => {
    if (!finished) return;
    restFinishedAlert();
    const id = window.setTimeout(() => closeRef.current(), 4000);
    return () => window.clearTimeout(id);
  }, [finished]);

  const R = 22;
  const C = 2 * Math.PI * R;
  const progress = total > 0 ? Math.min(1, left / total) : 0;

  return (
    <div className={`rest ${finished ? 'done' : ''}`} role="timer" aria-live={finished ? 'assertive' : 'off'}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle className="rest-track" cx="28" cy="28" r={R} />
        <circle
          className="rest-ring"
          cx="28"
          cy="28"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="rest-info">
        <small>{finished ? '¡A por la siguiente serie!' : `Descanso · ${exerciseName}`}</small>
        <b>{finished ? '0:00' : clock(left)}</b>
      </div>
      {!finished && (
        <div className="rest-actions">
          <button type="button" className="btn ghost sm" onClick={() => onAdjust(-15)} aria-label="Quitar 15 segundos">
            −15
          </button>
          <button type="button" className="btn ghost sm" onClick={() => onAdjust(15)} aria-label="Añadir 15 segundos">
            +15
          </button>
        </div>
      )}
      <button type="button" className="btn sm" onClick={onClose}>
        {finished ? 'Cerrar' : 'Saltar'}
      </button>
    </div>
  );
}
