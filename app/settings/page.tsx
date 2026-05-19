'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [rateInput, setRateInput]   = useState(String(settings.exchangeRate));
  const [nickInput, setNickInput]   = useState(settings.nickname);
  const [dateInput, setDateInput]   = useState(settings.tripDate ?? '');
  const [saved, setSaved]           = useState(false);

  function handleSave() {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        exchangeRate: parseFloat(rateInput) || 0.22,
        nickname: nickInput || '旅行者',
        tripDate: dateInput,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const totalItems = state.itinerary.length + state.expenses.length;

  function handleClearData() {
    if (confirm('確定要清除所有行程、支出與行李資料？此動作無法復原。')) {
      dispatch({
        type: 'LOAD_STATE',
        payload: { ...state, itinerary: [], expenses: [] },
      });
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">設定</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 旅行資訊 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
          <h2 className="font-semibold text-gray-800">旅行資訊</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">出發日期</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">設定後行程頁會顯示倒數計時</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">暱稱</label>
            <input
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              placeholder="旅行者"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* 匯率設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
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
          <button
            onClick={handleSave}
            className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors
              ${saved ? 'bg-green-500 text-white' : 'bg-red-600 text-white'}`}
          >
            {saved ? '✓ 已儲存' : '儲存設定'}
          </button>
        </div>

        {/* 資料統計 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">資料統計</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{state.itinerary.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">行程項目</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-500">{state.expenses.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">支出記錄</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(state.packingList ?? []).filter((p) => p.checked).length}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">行李勾選</div>
            </div>
          </div>
        </div>

        {/* 共享說明 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-2">家人共享</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            所有資料儲存在這台電腦上，同一 WiFi 內的家人連線至下方網址即可共享行程與帳務，每 5 秒自動同步。
          </p>
          <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400 mb-0.5">家人連線網址</p>
            <p className="text-sm font-mono text-red-600 font-semibold">
              {typeof window !== 'undefined' ? `http://${window.location.hostname}:3000` : ''}
            </p>
          </div>
        </div>

        {/* 危險操作 */}
        {totalItems > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-4">
            <h2 className="font-semibold text-red-600 mb-2">危險操作</h2>
            <button
              onClick={handleClearData}
              className="w-full border border-red-200 text-red-500 rounded-xl py-2.5 text-sm font-medium"
            >
              清除所有資料
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
