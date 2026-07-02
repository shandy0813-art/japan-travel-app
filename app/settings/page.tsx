'use client';

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [rateInput, setRateInput] = useState(String(settings.exchangeRate));
  const [apiKey, setApiKey]       = useState('');
  const [showKey, setShowKey]     = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini-api-key') ?? '';
    setApiKey(stored);
  }, []);

  function handleSave() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { exchangeRate: parseFloat(rateInput) || 0.22 },
    });
    localStorage.setItem('gemini-api-key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClearData() {
    if (confirm('確定要清除所有支出記錄？此動作無法復原。')) {
      dispatch({ type: 'LOAD_STATE', payload: { ...state, expenses: [] } });
    }
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">設定</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 匯率 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">匯率設定</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">1 JPY ≈ __ TWD</label>
            <input
              type="number"
              step="0.001"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">例：0.22（出發前請更新最新匯率）</p>
          </div>
        </div>

        {/* API Key */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">拍照辨識 API Key</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              >
                {showKey ? '隱藏' : '顯示'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">儲存在本機，不會上傳到任何伺服器</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors
            ${saved ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}
        >
          {saved ? '✓ 已儲存' : '儲存設定'}
        </button>

        {/* 資料統計 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">資料統計</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{state.expenses.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">支出筆數</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-500">
                {state.expenses.filter((e) => e.paymentMethod === 'credit').length}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">信用卡筆數</div>
            </div>
          </div>
        </div>

        {/* 危險操作 */}
        {state.expenses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <h2 className="font-semibold text-red-600 mb-2">危險操作</h2>
            <button
              onClick={handleClearData}
              className="w-full border border-red-200 text-red-500 rounded-xl py-2.5 text-sm font-medium"
            >
              清除所有支出記錄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
