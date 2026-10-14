import { useEffect, useState } from 'react';

/** Rutas con hash (#/rutinas/123): funcionan en GitHub Pages sin configurar el servidor. */
export function useRoute(): string[] {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function navigate(path: string): void {
  window.location.hash = '#/' + path.replace(/^\//, '');
  window.scrollTo({ top: 0 });
}
