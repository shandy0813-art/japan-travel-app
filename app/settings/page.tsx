'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { AppState } from '../context/AppContext';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [rateInput, setRateInput]                 = useState(String(settings.exchangeRate));
  const [pubBudgetInput, setPubBudgetInput]       = useState(String(settings.publicBudget || ''));
  const [pubBudgetCurrency, setPubBudgetCurrency] = useState<'JPY' | 'TWD'>(settings.publicBudgetCurrency);
  const [perBudgetInput, setPerBudgetInput]       = useState(String(settings.personalBudget || ''));
  const [perBudgetCurrency, setPerBudgetCurrency] = useState<'JPY' | 'TWD'>(settings.personalBudgetCurrency);
  const [apiKey, setApiKey]                       = useState('');
  const [showKey, setShowKey]                     = useState(false);
  const [saved, setSaved]                         = useState(false);
  const [fetching, setFetching]                   = useState(false);
  const [fetchMsg, setFetchMsg]                   = useState('');

  useEffect(() => {
    setApiKey(localStorage.getItem('gemini-api-key') ?? '');
  }, []);

  async function fetchLiveRate(silent = false): Promise<boolean> {
    setFetching(true);
    if (!silent) setFetchMsg('');
    const urls = [
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json',
      'https://latest.currency-api.pages.dev/v1/currencies/jpy.json',
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const twd = data?.jpy?.twd;
        if (typeof twd !== 'number' || twd <= 0) continue;
        const rounded = Math.round(twd * 10000) / 10000;
        const today = new Date().toISOString().slice(0, 10);
        setRateInput(String(rounded));
        dispatch({
          type: 'UPDATE_SETTINGS',
          payload: { exchangeRate: rounded, rateUpdatedAt: today },
        });
        setFetchMsg(`✓ 已更新：1 JPY = ${rounded} TWD`);
        setFetching(false);
        return true;
      } catch { /* try next */ }
    }
    if (!silent) setFetchMsg('⚠️ 抓取失敗，請檢查網路或手動輸入');
    setFetching(false);
    return false;
  }

  // 每次進設定頁若今天還沒抓過就自動抓一次
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (settings.rateUpdatedAt !== today) {
      fetchLiveRate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRateInput(String(settings.exchangeRate));
    setPubBudgetInput(String(settings.publicBudget || ''));
    setPubBudgetCurrency(settings.publicBudgetCurrency);
    setPerBudgetInput(String(settings.personalBudget || ''));
    setPerBudgetCurrency(settings.personalBudgetCurrency);
  }, [settings.exchangeRate, settings.publicBudget, settings.publicBudgetCurrency, settings.personalBudget, settings.personalBudgetCurrency]);

  function handleSave() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        exchangeRate: parseFloat(rateInput) || 0.22,
        publicBudget: Math.max(0, parseFloat(pubBudgetInput) || 0),
        publicBudgetCurrency: pubBudgetCurrency,
        personalBudget: Math.max(0, parseFloat(perBudgetInput) || 0),
        personalBudgetCurrency: perBudgetCurrency,
      },
    });
    localStorage.setItem('gemini-api-key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const rateUpdatedLabel = settings.rateUpdatedAt
    ? `更新於 ${settings.rateUpdatedAt}`
    : '尚未自動更新';

  const rateNum = parseFloat(rateInput) || settings.exchangeRate;
  const previewFor = (input: string, cur: 'JPY' | 'TWD') => {
    const n = Math.max(0, parseFloat(input) || 0);
    if (!n) return '';
    return cur === 'JPY'
      ? `≈ NT$ ${Math.round(n * rateNum).toLocaleString()}`
      : `≈ ¥ ${Math.round(n / rateNum).toLocaleString()}`;
  };
  const pubPreview = previewFor(pubBudgetInput, pubBudgetCurrency);
  const perPreview = previewFor(perBudgetInput, perBudgetCurrency);

  function handleClearData() {
    if (confirm('確定要清除所有支出記錄？此動作無法復原。')) {
      dispatch({ type: 'LOAD_STATE', payload: { ...state, expenses: [] } });
    }
  }

  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const payload = {
      app: 'japan-travel-app',
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japan-travel-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const s = data?.state as AppState | undefined;
      if (!s || !Array.isArray(s.expenses) || !s.settings) {
        alert('❌ 檔案格式錯誤：不是本 App 匯出的備份');
        return;
      }
      const count = s.expenses.length;
      const when = typeof data.exportedAt === 'string' ? data.exportedAt.slice(0, 10) : '未知日期';
      const currentCount = state.expenses.length;
      const msg = `確定匯入這份備份？將覆蓋目前所有資料。\n\n📥 備份：${count} 筆支出（${when}）\n📤 目前：${currentCount} 筆支出`;
      if (!confirm(msg)) return;
      // 合併：舊 settings 保底，避免備份缺欄位
      const merged: AppState = {
        expenses: s.expenses,
        settings: { ...state.settings, ...s.settings },
      };
      dispatch({ type: 'LOAD_STATE', payload: merged });
      alert('✅ 已匯入');
    } catch {
      alert('❌ 檔案解析失敗');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-4 py-3">
        <h1 className="text-lg font-bold text-stone-700">設定 ⚙️</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 匯率 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <h2 className="font-semibold text-stone-700">匯率設定</h2>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">1 JPY ≈ __ TWD</label>
            <div className="flex gap-2">
              <input type="number" step="0.0001" value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />
              <button onClick={() => fetchLiveRate(false)} disabled={fetching}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-[#c47a7a] text-white shadow-sm disabled:opacity-50 whitespace-nowrap">
                {fetching ? '抓取中…' : '🔄 抓最新'}
              </button>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-stone-400">{rateUpdatedLabel}</span>
              {fetchMsg && (
                <span className={fetchMsg.startsWith('✓') ? 'text-emerald-500' : 'text-rose-400'}>
                  {fetchMsg}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              進設定頁會自動抓當日匯率（資料來源：currency-api CDN，每日更新）
            </p>
          </div>
        </div>

        {/* 公費預算 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <h2 className="font-semibold text-stone-700">🏛️ 公費總預算</h2>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">公費總額</label>
            <div className="flex gap-2">
              <input type="number" step="1" placeholder="例：220000" value={pubBudgetInput}
                onChange={(e) => setPubBudgetInput(e.target.value)}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />
              <select value={pubBudgetCurrency}
                onChange={(e) => setPubBudgetCurrency(e.target.value as 'JPY' | 'TWD')}
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50">
                <option value="JPY">JPY ¥</option>
                <option value="TWD">TWD NT$</option>
              </select>
            </div>
            {pubPreview && (
              <p className="text-xs mt-1" style={{ color: '#6b8ec4' }}>{pubPreview}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              換好日幣就選 JPY；還沒換或想用台幣估就選 TWD。公費頁會用選的幣別為主、另一個換算顯示
            </p>
          </div>
        </div>

        {/* 自費預算 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <h2 className="font-semibold text-stone-700">🏠 自費總預算</h2>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">自費總額</label>
            <div className="flex gap-2">
              <input type="number" step="1" placeholder="例：30000" value={perBudgetInput}
                onChange={(e) => setPerBudgetInput(e.target.value)}
                className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />
              <select value={perBudgetCurrency}
                onChange={(e) => setPerBudgetCurrency(e.target.value as 'JPY' | 'TWD')}
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50">
                <option value="JPY">JPY ¥</option>
                <option value="TWD">TWD NT$</option>
              </select>
            </div>
            {perPreview && (
              <p className="text-xs mt-1" style={{ color: '#c47a7a' }}>{perPreview}</p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              自己家裡花費的預算上限；設 0 或留空則不顯示進度條
            </p>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <h2 className="font-semibold text-stone-700">拍照辨識 API Key</h2>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Google Gemini API Key（選填）</label>
            <div className="relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm pr-10 bg-stone-50" />
              <button onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                {showKey ? '隱藏' : '顯示'}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSave}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors text-white shadow-sm
            ${saved ? 'bg-emerald-400' : 'bg-[#c47a7a]'}`}>
          {saved ? '✓ 已儲存' : '儲存設定'}
        </button>

        {/* 資料統計 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
          <h2 className="font-semibold text-stone-700 mb-3">資料統計</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#f9eaea] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-[#c47a7a]">{state.expenses.length}</div>
              <div className="text-xs text-stone-500 mt-0.5">支出筆數</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {state.expenses.filter((e) => e.paymentMethod === 'credit').length}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">信用卡筆數</div>
            </div>
          </div>
        </div>

        {/* 備份/還原 */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4 space-y-3">
          <h2 className="font-semibold text-stone-700">💾 資料備份 / 還原</h2>
          <p className="text-xs text-stone-400 -mt-1">
            資料存在瀏覽器裡，清快取/換裝置會不見。旅程中建議偶爾匯出備份到雲端硬碟或相簿
          </p>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="flex-1 bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-medium shadow-sm">
              📥 匯出備份
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 border border-emerald-500 text-emerald-600 rounded-xl py-2.5 text-sm font-medium">
              📤 匯入備份
            </button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json"
            onChange={handleImport} className="hidden" />
        </div>

        {state.expenses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <h2 className="font-semibold text-rose-400 mb-2">危險操作</h2>
            <button onClick={handleClearData}
              className="w-full border border-rose-200 text-rose-400 rounded-xl py-2.5 text-sm font-medium">
              清除所有支出記錄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
