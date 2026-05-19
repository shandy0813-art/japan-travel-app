'use client';

import { createContext, useContext, useEffect, useReducer, useRef, ReactNode } from 'react';

// ── 型別定義 ──────────────────────────────────────────────
export interface ItineraryItem {
  id: string;
  date: string;
  title: string;
  location: string;
  note: string;
}

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: 'JPY' | 'TWD';
  note: string;
}

export interface PackingItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

export interface AppState {
  itinerary: ItineraryItem[];
  expenses: ExpenseItem[];
  packingList: PackingItem[];
  settings: {
    exchangeRate: number;
    nickname: string;
    darkMode: boolean;
    tripDate: string;
  };
}

const DEFAULT_PACKING: PackingItem[] = [
  { id: 'p1',  category: '證件', label: '護照',            checked: false },
  { id: 'p2',  category: '證件', label: '電子機票',        checked: false },
  { id: 'p3',  category: '證件', label: '信用卡',          checked: false },
  { id: 'p4',  category: '證件', label: '訂房確認',        checked: false },
  { id: 'p5',  category: '通訊', label: 'SIM卡 / WiFi分享器', checked: false },
  { id: 'p6',  category: '通訊', label: '行動電源',        checked: false },
  { id: 'p7',  category: '通訊', label: '充電線',          checked: false },
  { id: 'p8',  category: '通訊', label: '轉接頭（A型）',   checked: false },
  { id: 'p9',  category: '衣物', label: '換洗衣物',        checked: false },
  { id: 'p10', category: '衣物', label: '雨傘',            checked: false },
  { id: 'p11', category: '藥品', label: '腸胃藥',          checked: false },
  { id: 'p12', category: '藥品', label: '感冒藥',          checked: false },
  { id: 'p13', category: '藥品', label: '暈車藥',          checked: false },
  { id: 'p14', category: '現金', label: '日幣現金',        checked: false },
];

const defaultState: AppState = {
  itinerary: [],
  expenses: [],
  packingList: DEFAULT_PACKING,
  settings: {
    exchangeRate: 0.22,
    nickname: '旅行者',
    darkMode: false,
    tripDate: '',
  },
};

// ── Actions ──────────────────────────────────────────────
type Action =
  | { type: 'ADD_ITINERARY';   payload: ItineraryItem }
  | { type: 'DELETE_ITINERARY'; payload: string }
  | { type: 'ADD_EXPENSE';     payload: ExpenseItem }
  | { type: 'DELETE_EXPENSE';  payload: string }
  | { type: 'ADD_PACKING';     payload: PackingItem }
  | { type: 'DELETE_PACKING';  payload: string }
  | { type: 'TOGGLE_PACKING';  payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'LOAD_STATE';      payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':      return action.payload;
    case 'ADD_ITINERARY':   return { ...state, itinerary: [...state.itinerary, action.payload] };
    case 'DELETE_ITINERARY':return { ...state, itinerary: state.itinerary.filter((i) => i.id !== action.payload) };
    case 'ADD_EXPENSE':     return { ...state, expenses: [...state.expenses, action.payload] };
    case 'DELETE_EXPENSE':  return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
    case 'ADD_PACKING':     return { ...state, packingList: [...state.packingList, action.payload] };
    case 'DELETE_PACKING':  return { ...state, packingList: state.packingList.filter((p) => p.id !== action.payload) };
    case 'TOGGLE_PACKING':  return {
      ...state,
      packingList: state.packingList.map((p) =>
        p.id === action.payload ? { ...p, checked: !p.checked } : p
      ),
    };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.payload } };
    default:                return state;
  }
}

// ── Context ──────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const serverLoaded  = useRef(false);
  const isServerUpdate = useRef(false);
  const lastSyncedAt  = useRef<number>(0);

  // 啟動時從伺服器載入
  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((data) => {
        if (data.state) {
          isServerUpdate.current = true;
          dispatch({ type: 'LOAD_STATE', payload: data.state });
          lastSyncedAt.current = data.lastModified;
        }
        serverLoaded.current = true;
      })
      .catch(() => { serverLoaded.current = true; });
  }, []);

  // 每次 state 變化 → 同步至伺服器
  useEffect(() => {
    if (!serverLoaded.current) return;
    if (isServerUpdate.current) {
      isServerUpdate.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
        .then((r) => r.json())
        .then((data) => { lastSyncedAt.current = data.lastModified; })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  // 每 5 秒輪詢，同步其他家人的變更
  useEffect(() => {
    const interval = setInterval(() => {
      if (!serverLoaded.current) return;
      fetch('/api/data')
        .then((r) => r.json())
        .then((data) => {
          if (data.lastModified > lastSyncedAt.current) {
            lastSyncedAt.current = data.lastModified;
            isServerUpdate.current = true;
            dispatch({ type: 'LOAD_STATE', payload: data.state });
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
