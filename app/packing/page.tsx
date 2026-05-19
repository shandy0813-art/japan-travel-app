'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const CATEGORIES = ['證件', '通訊', '衣物', '藥品', '現金', '其他'];

export default function PackingPage() {
  const { state, dispatch } = useApp();
  const [addLabel, setAddLabel]       = useState('');
  const [addCategory, setAddCategory] = useState('其他');

  const list = state.packingList ?? [];
  const grouped = CATEGORIES.map((cat) => ({
    name: cat,
    items: list.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  const checked = list.filter((p) => p.checked).length;
  const total   = list.length;
  const pct     = total ? Math.round((checked / total) * 100) : 0;

  function handleAdd() {
    if (!addLabel.trim()) return;
    dispatch({
      type: 'ADD_PACKING',
      payload: { id: genId(), category: addCategory, label: addLabel.trim(), checked: false },
    });
    setAddLabel('');
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-bold text-gray-900">行李清單</h1>
            <p className="text-xs text-gray-400">已勾選 {checked} / {total} 項</p>
          </div>
          {checked > 0 && (
            <span className="text-xs bg-green-50 text-green-600 px-3 py-1 rounded-full font-medium">
              {pct}% 完成
            </span>
          )}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 新增列 */}
        <div className="flex gap-2">
          <select
            value={addCategory}
            onChange={(e) => setAddCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-2 py-2 text-sm bg-white"
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            placeholder="新增項目…"
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center text-xl leading-none shrink-0"
          >
            +
          </button>
        </div>

        {/* 分類清單 */}
        {grouped.map((group) => (
          <div key={group.name} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group.name}</span>
            </div>
            {group.items.map((item) => (
              <div key={item.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_PACKING', payload: item.id })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                    ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                >
                  {item.checked && <span className="text-white text-[10px] font-bold">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                <button
                  onClick={() => dispatch({ type: 'DELETE_PACKING', payload: item.id })}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ))}

        {total === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🧳</div>
            <p className="text-sm">清單是空的，新增行李項目吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
