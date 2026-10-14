import { useEffect, useState } from 'react';

interface Props {
  id: string;
  value: number;
  onChange: (n: number) => void;
  label: string;
  decimals?: boolean;
  suffix?: string;
}

/**
 * Campo numérico cómodo en el móvil: abre el teclado numérico, acepta coma decimal
 * ("62,5") y permite estados intermedios mientras se escribe.
 */
export function NumberField({ id, value, onChange, label, decimals = false, suffix }: Props) {
  const [text, setText] = useState(value ? String(value).replace('.', ',') : '');

  // Si el valor cambia desde fuera (por ejemplo, al añadir una serie), se sincroniza.
  useEffect(() => {
    const parsed = parse(text);
    if (parsed !== value) setText(value ? String(value).replace('.', ',') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="num-field">
      <input
        id={id}
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        aria-label={label}
        placeholder="0"
        value={text}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const clean = e.target.value.replace(decimals ? /[^\d.,]/g : /\D/g, '').slice(0, 6);
          setText(clean);
          onChange(parse(clean));
        }}
      />
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </label>
  );
}

function parse(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}
