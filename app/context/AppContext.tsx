'use client';

import { createContext, useContext, useEffect, useReducer, useRef, useState, useCallback, ReactNode } from 'react';
import { pullState, pushState, normalizeCode } from '../lib/sync';

export type FundSource = 'public' | 'personal';

export interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  amount: number;
  currency: 'JPY' | 'TWD';
  paymentMethod: 'cash' | 'credit';
  fundSource: FundSource;
  txRate?: number;
  note: string;
}

export interface AppState {
  expenses: ExpenseItem[];
  settings: {
    exchangeRate: number;
    nickname: string;
    tripDate: string;
    publicBudget: number;
    publicBudgetCurrency: 'JPY' | 'TWD';
    personalBudget: number;
    personalBudgetCurrency: 'JPY' | 'TWD';
    rateUpdatedAt: string;
  };
}

const defaultState: AppState = {
  expenses: [],
  settings: {
    exchangeRate: 0.22,
    nickname: '旅行者',
    tripDate: '',
    publicBudget: 0,
    publicBudgetCurrency: 'TWD',
    personalBudget: 0,
    personalBudgetCurrency: 'TWD',
    rateUpdatedAt: '',
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

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  syncCode: string;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  syncNow: () => Promise<void>;
  enableSync: (code: string) => Promise<'pulled' | 'pushed' | 'error'>;
  disableSync: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);
const STORAGE_KEY = 'japan-travel-app-v2';
const SYNC_CODE_KEY = 'japan-travel-sync-code';
const SYNC_ENABLED_KEY = 'japan-travel-sync-enabled';
const POLL_MS = 5000;
const PUSH_DEBOUNCE_MS = 700;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const loaded = useRef(false);
  const [syncCode, setSyncCode] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [syncMessage, setSyncMessage] = useState('');
  // 記錄目前 remote 內容的 hash，避免推送/拉取回音無限循環
  const knownHashRef = useRef<string>('');
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初次載入 localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Partial<AppState>;
        const migrated: AppState = {
          expenses: (data.expenses ?? []).map((e) => ({
            ...e,
            fundSource: e.fundSource ?? 'personal',
          })),
          settings: {
            ...defaultState.settings,
            ...(data.settings ?? {}),
          },
        };
        dispatch({ type: 'LOAD_STATE', payload: migrated });
      }
      const savedCode = localStorage.getItem(SYNC_CODE_KEY) ?? '';
      const savedEnabled = localStorage.getItem(SYNC_ENABLED_KEY) === '1';
      if (savedCode) setSyncCode(savedCode);
      if (savedEnabled && savedCode) {
        setSyncEnabled(true);
        setSyncStatus('syncing');
      }
    } catch {}
    loaded.current = true;
  }, []);

  // state 變 → 存 localStorage
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // state 變 → 推 Firebase（debounced）
  useEffect(() => {
    if (!loaded.current || !syncEnabled || !syncCode) return;
    const hash = JSON.stringify(state);
    if (hash === knownHashRef.current) return; // 避免收到 remote 又推回去
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        await pushState(syncCode, state);
        knownHashRef.current = hash;
        setSyncStatus('synced');
        setSyncMessage(`已同步 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`);
      } catch (err) {
        setSyncStatus('error');
        setSyncMessage(`推送失敗：${(err as Error).message}`);
      }
    }, PUSH_DEBOUNCE_MS);
  }, [state, syncEnabled, syncCode]);

  // Poll Firebase
  const pullOnce = useCallback(async () => {
    if (!syncEnabled || !syncCode) return;
    try {
      const remote = await pullState(syncCode);
      if (!remote) return;
      const hash = JSON.stringify(remote);
      if (hash === knownHashRef.current) return;
      knownHashRef.current = hash;
      dispatch({ type: 'LOAD_STATE', payload: remote });
      setSyncStatus('synced');
      setSyncMessage(`已同步 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(`拉取失敗：${(err as Error).message}`);
    }
  }, [syncEnabled, syncCode]);

  useEffect(() => {
    if (!syncEnabled || !syncCode) return;
    pullOnce();
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') pullOnce();
    }, POLL_MS);
    const onVis = () => { if (document.visibilityState === 'visible') pullOnce(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [syncEnabled, syncCode, pullOnce]);

  const syncNow = useCallback(async () => {
    await pullOnce();
  }, [pullOnce]);

  const enableSync = useCallback(async (rawCode: string): Promise<'pulled' | 'pushed' | 'error'> => {
    const code = normalizeCode(rawCode);
    if (!code) { setSyncMessage('同步碼不能是空的'); setSyncStatus('error'); return 'error'; }
    setSyncCode(code);
    localStorage.setItem(SYNC_CODE_KEY, code);
    localStorage.setItem(SYNC_ENABLED_KEY, '1');
    setSyncEnabled(true);
    setSyncStatus('syncing');
    // 決定是拉還是推：若 remote 已有資料就拉，否則推目前的
    try {
      const remote = await pullState(code);
      if (remote) {
        knownHashRef.current = JSON.stringify(remote);
        dispatch({ type: 'LOAD_STATE', payload: remote });
        setSyncStatus('synced');
        setSyncMessage(`已拉取遠端資料（${remote.expenses.length} 筆支出）`);
        return 'pulled';
      } else {
        await pushState(code, state);
        knownHashRef.current = JSON.stringify(state);
        setSyncStatus('synced');
        setSyncMessage(`已建立同步（${state.expenses.length} 筆支出上傳）`);
        return 'pushed';
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(`啟用失敗：${(err as Error).message}`);
      return 'error';
    }
  }, [state]);

  const disableSync = useCallback(() => {
    setSyncEnabled(false);
    setSyncStatus('off');
    setSyncMessage('');
    knownHashRef.current = '';
    localStorage.setItem(SYNC_ENABLED_KEY, '0');
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
  }, []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      syncCode, syncEnabled, syncStatus, syncMessage,
      syncNow, enableSync, disableSync,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
