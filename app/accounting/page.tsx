'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ExpenseItem } from '../context/AppContext';

const CATEGORIES = ['餐飲', '交通', '住宿', '購物', '門票', '其他'];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AccountingPage() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '餐飲',
    amount: '',
    currency: 'JPY' as 'JPY' | 'TWD',
    note: '',
  });

  const { exchangeRate } = state.settings;
  const sorted = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));

  const totalJPY = state.expenses.reduce((sum, e) =>
    sum + (e.currency === 'JPY' ? e.amount : e.amount / exchangeRate), 0);
  const totalTWD = totalJPY * exchangeRate;

  function handleAdd() {
    if (!form.amount || isNaN(Number(form.amount))) return;
    const item: ExpenseItem = {
      id: genId(),
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      note: form.note,
    };
    dispatch({ type: 'ADD_EXPENSE', payload: item });
    setForm({ ...form, amount: '', note: '' });
    setShowForm(false);
  }

  const toTWD = (e: ExpenseItem) =>
    e.currency === 'JPY' ? (e.amount * exchangeRate).toFixed(0) : e.amount.toFixed(0);

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">旅遊記帳</h1>
          <p className="text-xs text-gray-400">匯率 1 JPY ≈ {exchangeRate} TWD</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 bg-red-600 text-white rounded-full flex items-center justify-center text-xl leading-none"
        >
          +
        </button>
      </div>

      {/* 總計卡片 */}
      <div className="mx-4 mt-4 bg-red-600 rounded-2xl p-4 text-white">
        <div className="text-xs opacity-80 mb-1">總花費</div>
        <div className="text-2xl font-bold">¥ {Math.round(totalJPY).toLocaleString()}</div>
        <div className="text-sm opacity-80 mt-0.5">≈ NT$ {Math.round(totalTWD).toLocaleString()}</div>
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-3">
          <h2 className="font-semibold text-gray-800">新增支出</h2>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button key={c}
                onClick={() => setForm({ ...form, category: c })}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors
                  ${form.category === c ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="number" placeholder="金額" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <select value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as 'JPY' | 'TWD' })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
              <option value="JPY">JPY ¥</option>
              <option value="TWD">TWD NT$</option>
            </select>
          </div>
          <input placeholder="備註（選填）" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
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

      {/* 支出列表 */}
      <div className="px-4 py-4 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">💴</div>
            <p className="text-sm">還沒有支出記錄</p>
          </div>
        ) : (
          sorted.map((item) => (
            <div key={item.id}
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-400">{item.date}</span>
                </div>
                {item.note && (
                  <div className="text-sm text-gray-700 mt-1 truncate">{item.note}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-gray-800 text-sm">
                  {item.currency === 'JPY' ? '¥' : 'NT$'} {item.amount.toLocaleString()}
                </div>
                {item.currency === 'JPY' && (
                  <div className="text-xs text-gray-400">≈ NT$ {toTWD(item)}</div>
                )}
              </div>
              <button
                onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: item.id })}
                className="text-gray-300 hover:text-red-400 text-lg leading-none">
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
