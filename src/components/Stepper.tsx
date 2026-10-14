interface Props {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
  onChange: (n: number) => void;
}

/** Control − valor + pensado para usarse con el pulgar. */
export function Stepper({ id, label, value, min, max, step = 1, format = String, onChange }: Props) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, n)));
  return (
    <div className="stepper" role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="stepper-label">
        {label}
      </span>
      <div className="stepper-ctrl">
        <button type="button" onClick={() => set(value - step)} disabled={value <= min} aria-label={`Menos ${label}`}>
          −
        </button>
        <output aria-live="polite">{format(value)}</output>
        <button type="button" onClick={() => set(value + step)} disabled={value >= max} aria-label={`Más ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}
