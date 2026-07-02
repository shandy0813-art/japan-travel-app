'use client';

import { createContext, useContext, useEffect, useReducer, useRef, ReactNode } from 'react';

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: 'JPY' | 'TWD';
  paymentMethod: 'cash' | 'credit';
  txRate?: number;
  note: string;
}

export interface AppState {
  expenses: ExpenseItem[];
  settings: {
    exchangeRate: number;
    nickname: string;
    tripDate: string;
  };
}

const defaultState: AppState = {
  expenses: [],
  settings: {
    exchangeRate: 0.22,
    nickname: '旅行者',
    tripDate: '',
  },
};

type Action =
  | { type: 'ADD_EXPENSE';     payload: ExpenseItem }
  | { type: 'DELETE_EXPENSE';  payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'LOAD_STATE';      payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':      return action.payload;
    case 'ADD_EXPENSE':     return { ...state, expenses: [...state.expenses, action.payload] };
    case 'DELETE_EXPENSE':  return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    default:                return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = 'japan-travel-app-v2';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data) dispatch({ type: 'LOAD_STATE', payload: data });
      }
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
