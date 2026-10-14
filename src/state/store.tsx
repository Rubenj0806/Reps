import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState } from '../types';
import { reducer, type Action } from './reducer';
import { createSampleState } from './sample';

const STORAGE_KEY = 'reps:v1';

function isAppState(value: unknown): value is AppState {
  const v = value as AppState | null;
  return !!v && v.version === 1 && Array.isArray(v.routines) && Array.isArray(v.workouts);
}

/** Carga los datos guardados; si no hay (o están dañados), empieza con el ejemplo. */
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppState(parsed)) return parsed;
    }
  } catch {
    // Almacenamiento bloqueado o JSON inválido: seguimos con los datos de ejemplo.
  }
  return createSampleState(new Date());
}

interface StoreValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Si no se puede guardar (modo privado, almacenamiento lleno), la app sigue funcionando en memoria.
    }
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return value;
}
