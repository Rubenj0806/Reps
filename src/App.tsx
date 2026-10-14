import { useCallback, useEffect, useState } from 'react';
import { Icon, type IconName } from './components/Icon';
import { TOUR_KEY, Tour } from './components/Tour';
import { navigate, useRoute } from './hooks/useRoute';
import { useNow } from './hooks/useNow';
import { clock } from './lib/format';
import { Exercises } from './pages/Exercises';
import { History } from './pages/History';
import { Home } from './pages/Home';
import { Progress } from './pages/Progress';
import { RoutineEditor } from './pages/RoutineEditor';
import { Routines } from './pages/Routines';
import { Workout } from './pages/Workout';
import { useStore } from './state/store';

type Theme = 'light' | 'dark' | 'system';
const THEME_KEY = 'reps:theme';

const TABS: { path: string; label: string; icon: IconName }[] = [
  { path: '', label: 'Inicio', icon: 'home' },
  { path: 'rutinas', label: 'Rutinas', icon: 'list' },
  { path: 'entreno', label: 'Entreno', icon: 'dumbbell' },
  { path: 'progreso', label: 'Progreso', icon: 'chart' },
  { path: 'historial', label: 'Historial', icon: 'history' },
];

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Sin almacenamiento: el tema se mantiene solo durante esta visita.
    }
  }, [theme]);
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

function Page({ route }: { route: string[] }) {
  const [section, param] = route;
  switch (section) {
    case undefined:
      return <Home />;
    case 'rutinas':
      return param ? <RoutineEditor key={param} routineId={param} /> : <Routines />;
    case 'entreno':
      return <Workout />;
    case 'progreso':
      return <Progress exerciseId={param} />;
    case 'historial':
      return <History />;
    case 'ejercicios':
      return <Exercises />;
    default:
      return (
        <div className="page">
          <div className="empty-state">
            <p>Esta página no existe.</p>
            <button type="button" className="btn primary" onClick={() => navigate('')}>
              Ir al inicio
            </button>
          </div>
        </div>
      );
  }
}

export default function App() {
  const route = useRoute();
  const { state } = useStore();
  const { isDark, toggle } = useTheme();
  const now = useNow(1000, !!state.active);
  const section = route[0] ?? '';
  const [tour, setTour] = useState(() => {
    try {
      return !localStorage.getItem(TOUR_KEY);
    } catch {
      return true;
    }
  });
  const closeTour = useCallback(() => setTour(false), []);

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => navigate('')} aria-label="Reps, ir al inicio">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="dumbbell" size={18} />
          </span>
          Reps
        </button>
        <nav className="top-nav" aria-label="Secciones">
          {[...TABS, { path: 'ejercicios', label: 'Ejercicios', icon: 'search' as IconName }].map((t) => (
            <a key={t.path} href={`#/${t.path}`} data-tour={t.path || 'inicio'} aria-current={section === t.path ? 'page' : undefined}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn mobile-only"
            data-tour="ejercicios"
            onClick={() => navigate('ejercicios')}
            aria-label="Catálogo de ejercicios"
          >
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="icon-btn help-btn"
            onClick={() => {
              navigate('');
              setTour(true);
            }}
            aria-label="Ver la guía de la app"
            title="Ver la guía"
          >
            <Icon name="help" />
          </button>
          <button type="button" className="icon-btn" onClick={toggle} aria-label={isDark ? 'Usar tema claro' : 'Usar tema oscuro'}>
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main id="main">
        <Page route={route} />
      </main>

      {state.active && section !== 'entreno' && !(section === 'rutinas' && route[1]) && (
        <button type="button" className="active-pill" onClick={() => navigate('entreno')}>
          <span className="pulse" aria-hidden="true" />
          {state.active.name} · {clock((now.getTime() - new Date(state.active.startedAt).getTime()) / 1000)}
          <b>Volver</b>
        </button>
      )}

      {tour && <Tour onClose={closeTour} />}

      <nav className="tabbar" aria-label="Secciones">
        {TABS.map((t) => (
          <a key={t.path} href={`#/${t.path}`} data-tour={t.path || 'inicio'} aria-current={section === t.path ? 'page' : undefined}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
            {t.path === 'entreno' && state.active && <span className="badge" aria-label="en curso" />}
          </a>
        ))}
      </nav>
    </div>
  );
}
