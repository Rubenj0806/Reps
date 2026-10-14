let ctx: AudioContext | null = null;

/** Los navegadores solo permiten sonido tras un toque del usuario: se prepara al marcar una serie. */
export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

/** Dos pitidos cortos y una vibración al acabar el descanso. */
export function restFinishedAlert(): void {
  try {
    navigator.vibrate?.([180, 90, 180]);
  } catch {
    // Vibración no disponible (ordenador o iOS): no pasa nada.
  }
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, 0.22].forEach((offset) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.18);
  });
}
