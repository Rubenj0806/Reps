import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { navigate } from '../hooks/useRoute';

export const TOUR_KEY = 'reps:tour-visto';

interface Step {
  /** Valor de `data-tour` del elemento que se ilumina. Sin destino, el mensaje aparece centrado. */
  target?: string;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    title: '¡Hola! Soy Coach',
    text: 'Te enseño Reps en un minuto. Es tu diario de entrenamiento: apuntas lo que levantas en el gimnasio y ves cómo vas mejorando semana a semana.',
  },
  {
    target: 'inicio',
    title: 'Inicio',
    text: 'Tu resumen: cuántas veces has entrenado esta semana, el peso total levantado y tu racha de semanas seguidas. Desde aquí empiezas un entreno con un toque.',
  },
  {
    target: 'rutinas',
    title: 'Rutinas',
    text: 'Son tus plantillas: qué ejercicios haces cada día, con cuántas series, repeticiones y descanso. Crea las tuyas o usa las de ejemplo.',
  },
  {
    target: 'entreno',
    title: 'Entreno',
    text: 'Lo usas en el gimnasio. Te propongo el peso de la última vez, marcas cada serie con ✓ al terminarla y arranco el descanso con un aviso cuando acaba.',
  },
  {
    target: 'progreso',
    title: 'Progreso',
    text: 'Elige un ejercicio y mira en la gráfica cómo suben tus marcas. Toca cualquier punto para ver el detalle de ese día.',
  },
  {
    target: 'historial',
    title: 'Historial',
    text: 'Todos tus entrenos ordenados por mes, con cada ejercicio y las series que hiciste. Toca uno para ver el detalle.',
  },
  {
    target: 'ejercicios',
    title: 'Ejercicios',
    text: 'El catálogo completo con buscador y filtro por músculo. Si ya lo has hecho alguna vez, verás tu récord.',
  },
  {
    title: 'Todo listo',
    text: 'Al principio verás seis semanas de entrenos de ejemplo para que lo veas todo con datos. Puedes borrarlos o volver a cargarlos desde Inicio. Si quieres volver a verme, pulsa el botón «?» de arriba.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Busca el elemento visible con ese `data-tour` (hay versión móvil y de escritorio del menú). */
function findTarget(name: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const el of all) if (el.offsetParent !== null && el.getClientRects().length) return el;
  return null;
}

export function Tour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch {
      // Sin almacenamiento, la guía volverá a salir la próxima vez: no es grave.
    }
    onClose();
  }, [onClose]);

  // Mide el elemento señalado y vuelve a medir si cambia el tamaño de la ventana.
  useLayoutEffect(() => {
    function measure() {
      const el = step.target ? findTarget(step.target) : null;
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      const pad = 6;
      setRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.target]);

  useEffect(() => {
    card.current?.querySelector<HTMLButtonElement>('.tour-next')?.focus();
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(STEPS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [finish]);

  // Coloca el mensaje encima o debajo del elemento, sin salirse de la pantalla.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(340, vw - 32);
  let style: CSSProperties;
  let arrow: 'up' | 'down' | null = null;
  if (rect) {
    const below = rect.top + rect.height / 2 < vh / 2;
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 16);
    style = below ? { top: rect.top + rect.height + 14, left, width: cardW } : { bottom: vh - rect.top + 14, left, width: cardW };
    arrow = below ? 'up' : 'down';
  } else {
    style = { top: '50%', left: '50%', width: cardW, transform: 'translate(-50%, -50%)' };
  }
  const arrowLeft = rect ? Math.min(Math.max(24, rect.left + rect.width / 2 - (style.left as number)), cardW - 24) : 0;

  return (
    <div className="tour" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
      {rect ? (
        <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div className={`tour-card ${arrow ? `arrow-${arrow}` : 'center'}`} style={style} ref={card}>
        {arrow && <span className="tour-arrow" style={{ left: arrowLeft }} aria-hidden="true" />}
        <div className="tour-head">
          <Coach waving={index === 0 || last} />
          <div>
            <small>
              {index + 1} de {STEPS.length}
            </small>
            <h2 id="tour-title">{step.title}</h2>
          </div>
        </div>
        <p id="tour-text">{step.text}</p>
        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === index ? 'on' : ''} />
          ))}
        </div>
        <div className="tour-actions">
          {!last && (
            <button type="button" className="link muted-link" onClick={finish}>
              Saltar guía
            </button>
          )}
          <div>
            {index > 0 && (
              <button type="button" className="btn ghost sm" onClick={() => setIndex(index - 1)}>
                Atrás
              </button>
            )}
            <button
              type="button"
              className="btn primary sm tour-next"
              onClick={() => {
                if (last) {
                  finish();
                  navigate('');
                } else setIndex(index + 1);
              }}
            >
              {last ? '¡A entrenar!' : index === 0 ? 'Enséñame' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** El personaje guía: una mancuerna con cara y cinta en la frente. */
export function Coach({ waving = false, size = 56 }: { waving?: boolean; size?: number }) {
  return (
    <svg className={`coach ${waving ? 'waving' : ''}`} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="coach-bg" />
      {/* cuerpo: cabeza redonda */}
      <circle cx="32" cy="34" r="17" className="coach-face" />
      {/* cinta */}
      <path d="M15.5 28h33" className="coach-band" />
      <path d="M48 27l7-4M48 29l6 3" className="coach-band thin" />
      {/* ojos y sonrisa */}
      <circle cx="26" cy="35" r="2.2" className="coach-ink" />
      <circle cx="38" cy="35" r="2.2" className="coach-ink" />
      <path d="M26 41.5q6 5 12 0" className="coach-smile" />
      {/* brazo saludando con mancuerna */}
      <g className="coach-arm">
        <path d="M47 44l7-9" className="coach-limb" />
        <path d="M50.5 31.5l7 5M52 30l3.5 2.5M56 35l3.5 2.5" className="coach-weight" />
      </g>
    </svg>
  );
}
