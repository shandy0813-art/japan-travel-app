'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ItineraryItem } from '../context/AppContext';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function getCountdown(tripDate: string): { text: string; sub: string } | null {
  if (!tripDate) return null;
  const now  = new Date();
  now.setHours(0, 0, 0, 0);
  const trip = new Date(tripDate);
  trip.setHours(0, 0, 0, 0);
  const diff = Math.round((trip.getTime() - now.getTime()) / 86400000);
  if (diff > 0)  return { text: `${diff}`, sub: '天後出發 🗺️' };
  if (diff === 0) return { text: '今天出發！', sub: '旅程開始 ✈️' };
  return { text: `旅行中`, sub: `第 ${Math.abs(diff) + 1} 天 🇯🇵` };
}

export default function ItineraryPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', title: '', location: '', note: '' });

  const sorted   = [...state.itinerary].sort((a, b) => a.date.localeCompare(b.date));
  const countdown = getCountdown(state.settings?.tripDate ?? '');

  function handleAdd() {
    if (!form.title || !form.date) return;
    const item: ItineraryItem = { id: genId(), ...form };
    dispatch({ type: 'ADD_ITINERARY', payload: item });
    setForm({ date: '', title: '', location: '', note: '' });
    setShowForm(false);
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">行程規劃</h1>
          <p className="text-xs text-gray-400">日本旅遊行程</p>
        </div>
        <div className="flex items-center gap-3">
          {countdown && (
            <div className="text-right">
              <div className="text-base font-bold text-red-600 leading-tight">{countdown.text}</div>
              <div className="text-[10px] text-gray-400">{countdown.sub}</div>
            </div>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center text-xl leading-none"
          >
            +
          </button>
        </div>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-800">新增行程</h2>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="行程標題" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <input placeholder="地點（選填）" value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <textarea placeholder="備註（選填）" value={form.note} rows={2}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium">
              新增
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2 text-sm font-medium">
              取消
            </button>
          </div>
        </div>
      )}

      {/* 行程列表 */}
      <div className="px-4 py-4 space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🗾</div>
            <p className="text-sm">還沒有行程，點右上角「+」開始規劃！</p>
            {!state.settings?.tripDate && (
              <p className="text-xs mt-2 text-gray-300">提示：到「設定」輸入出發日期可顯示倒數</p>
            )}
          </div>
        ) : (
          sorted.map((item) => (
            <div key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-red-500 font-medium mb-0.5">{item.date}</div>
                  <div className="font-semibold text-gray-800 truncate">{item.title}</div>
                  {item.location && (
                    <div className="text-xs text-gray-400 mt-0.5">📍 {item.location}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.note}</div>
                  )}
                </div>
                <button
                  onClick={() => dispatch({ type: 'DELETE_ITINERARY', payload: item.id })}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
