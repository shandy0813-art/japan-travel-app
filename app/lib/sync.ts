import type { AppState } from '../context/AppContext';

export const FIREBASE_URL = 'https://japan-travel-2026-923bb-default-rtdb.asia-southeast1.firebasedatabase.app';

export function normalizeCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function nodeUrl(code: string): string {
  return `${FIREBASE_URL}/travel/${encodeURIComponent(code)}.json`;
}

export async function pullState(code: string): Promise<AppState | null> {
  const res = await fetch(nodeUrl(code), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  const data = await res.json();
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.expenses) || !data.settings) return null;
  return data as AppState;
}

export async function pushState(code: string, state: AppState): Promise<void> {
  const res = await fetch(nodeUrl(code), {
    method: 'PUT',
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error(`Push failed: ${res.status}`);
}
