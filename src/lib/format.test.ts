import { describe, expect, it } from 'vitest';
import { kg, volume } from './format';

describe('formato', () => {
  it('muestra el peso con coma decimal', () => {
    expect(kg(62.5)).toBe('62,5 kg');
  });

  it('pasa a toneladas a partir de 1000 kg', () => {
    expect(volume(850)).toBe('850 kg');
    expect(volume(9612.5)).toBe('9,6 t');
    expect(volume(14100)).toBe('14,1 t');
  });
});
