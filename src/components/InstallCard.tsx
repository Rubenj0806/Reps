import { useEffect, useState } from 'react';
import { PWA_ENABLED, canPrompt, isIOS, isStandalone, promptInstall, subscribe } from '../lib/pwa';
import { Icon } from './Icon';

const HIDE_KEY = 'reps:instalar-oculto';

/** Tarjeta para instalar Reps en la pantalla de inicio. Solo sale cuando se puede instalar. */
export function InstallCard() {
  const [, refresh] = useState(0);
  const [hidden, setHidden] = useState(() => {
    try {
      return !!localStorage.getItem(HIDE_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => subscribe(() => refresh((n) => n + 1)), []);

  const ios = isIOS();
  if (!PWA_ENABLED || hidden || isStandalone() || (!canPrompt() && !ios)) return null;

  function hide() {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_KEY, '1');
    } catch {
      // Sin almacenamiento la tarjeta volverá a salir: no es grave.
    }
  }

  return (
    <section className="card install" aria-labelledby="install-title">
      <span className="install-icon" aria-hidden="true">
        <Icon name="dumbbell" size={22} />
      </span>
      <div className="install-text">
        <h2 id="install-title">Instala Reps en tu móvil</h2>
        {ios ? (
          <p>
            En Safari, pulsa <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>. Se abre a pantalla completa y
            funciona sin conexión.
          </p>
        ) : (
          <p>Ábrela desde la pantalla de inicio, a pantalla completa y sin conexión, como cualquier otra app.</p>
        )}
        <div className="install-actions">
          {!ios && (
            <button type="button" className="btn primary sm" onClick={() => promptInstall()}>
              Instalar
            </button>
          )}
          <button type="button" className="btn ghost sm" onClick={hide}>
            {ios ? 'Entendido' : 'Ahora no'}
          </button>
        </div>
      </div>
    </section>
  );
}
