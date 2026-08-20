'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ExpenseItem, FundSource } from '../context/AppContext';

const CATEGORIES = ['餐飲', '玩樂', '交通', '住宿', '購物', '伴手禮', '門票', '其他'];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

type Filter = 'all' | 'cash' | 'credit';

const FUND_META: Record<FundSource, { label: string; emoji: string; gradient: string; accent: string; chipBg: string; chipText: string }> = {
  public:   { label: '公費', emoji: '🏛️', gradient: 'linear-gradient(135deg, #6b8ec4 0%, #7ea9b8 100%)', accent: '#6b8ec4', chipBg: '#eaf0f8', chipText: '#4a6b96' },
  personal: { label: '自費', emoji: '🏠', gradient: 'linear-gradient(135deg, #c47a7a 0%, #d4956e 100%)', accent: '#c47a7a', chipBg: '#f9eaea', chipText: '#c47a7a' },
};

export default function AccountingPage() {
  const { state, dispatch } = useApp();
  const [fundTab, setFundTab] = useState<FundSource>('public');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '餐飲',
    amount: '',
    currency: 'JPY' as 'JPY' | 'TWD',
    paymentMethod: 'cash' as 'cash' | 'credit',
    txRate: '',
    note: '',
  });

  const { exchangeRate, publicBudget } = state.settings;
  const meta = FUND_META[fundTab];

  function getRate(e: ExpenseItem) { return e.txRate ?? exchangeRate; }
  function toTWD(e: ExpenseItem) {
    return e.currency === 'TWD' ? e.amount : e.amount * getRate(e);
  }

  const fundExpenses   = state.expenses.filter((e) => e.fundSource === fundTab);
  const cashExpenses   = fundExpenses.filter((e) => e.paymentMethod !== 'credit');
  const creditExpenses = fundExpenses.filter((e) => e.paymentMethod === 'credit');
  const totalCashTWD   = cashExpenses.reduce((s, e) => s + toTWD(e), 0);
  const totalCreditTWD = creditExpenses.reduce((s, e) => s + toTWD(e), 0);
  const totalTWD       = totalCashTWD + totalCreditTWD;

  const showBudget = fundTab === 'public' && publicBudget > 0;
  const remainingTWD = publicBudget - totalTWD;
  const usedPct = publicBudget > 0 ? Math.min(100, (totalTWD / publicBudget) * 100) : 0;

  const displayed = filter === 'all' ? fundExpenses : filter === 'cash' ? cashExpenses : creditExpenses;
  const sorted = [...displayed].sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd() {
    if (!form.amount || isNaN(Number(form.amount))) return;
    const item: ExpenseItem = {
      id: genId(),
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      paymentMethod: form.paymentMethod,
      fundSource: fundTab,
      note: form.note,
      ...(form.paymentMethod === 'credit' && form.currency === 'JPY' && form.txRate
        ? { txRate: parseFloat(form.txRate) } : {}),
    };
    dispatch({ type: 'ADD_EXPENSE', payload: item });
    setForm({ ...form, amount: '', note: '', txRate: '' });
    setShowForm(false);
  }

  const fmt = (n: number) => Math.round(n).toLocaleString();
  const showTxRateField = form.paymentMethod === 'credit' && form.currency === 'JPY';

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-100 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-700">旅遊記帳 🌸</h1>
          <p className="text-xs text-stone-400">預設匯率 1 JPY ≈ {exchangeRate} TWD</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-9 h-9 text-white rounded-full flex items-center justify-center text-xl leading-none shadow-sm"
          style={{ background: meta.accent }}
        >+</button>
      </div>

      {/* 公費 / 自費 大分頁 */}
      <div className="mx-4 mt-4 flex bg-stone-100 rounded-2xl p-1 gap-1">
        {(['public', 'personal'] as FundSource[]).map((k) => {
          const m = FUND_META[k];
          const active = fundTab === k;
          return (
            <button key={k} onClick={() => setFundTab(k)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${active ? 'bg-white shadow-sm' : 'text-stone-500'}`}
              style={active ? { color: m.accent } : {}}>
              {m.emoji} {m.label}
            </button>
          );
        })}
      </div>

      {/* 總計卡片 */}
      <div className="mx-4 mt-3 rounded-2xl p-4 text-white shadow-sm"
        style={{ background: meta.gradient }}>
        <div className="text-xs opacity-80 mb-1">{meta.emoji} {meta.label}總花費（台幣）</div>
        <div className="text-2xl font-bold tracking-wide">NT$ {fmt(totalTWD)}</div>

        {showBudget && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <div className="flex justify-between text-xs opacity-80 mb-1.5">
              <span>預算 NT$ {fmt(publicBudget)}</span>
              <span className={remainingTWD < 0 ? 'font-semibold' : ''}>
                {remainingTWD >= 0 ? `剩餘 NT$ ${fmt(remainingTWD)}` : `超支 NT$ ${fmt(-remainingTWD)}`}
              </span>
            </div>
            <div className="h-2 bg-white/25 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${usedPct}%`,
                  background: remainingTWD < 0 ? '#fca5a5' : '#ffffff',
                }} />
            </div>
          </div>
        )}

        <div className="flex gap-6 mt-3 pt-3 border-t border-white/20">
          <div>
            <div className="text-xs opacity-70">💵 現金</div>
            <div className="text-sm font-semibold mt-0.5">NT$ {fmt(totalCashTWD)}</div>
          </div>
          <div>
            <div className="text-xs opacity-70">💳 信用卡</div>
            <div className="text-sm font-semibold mt-0.5">NT$ {fmt(totalCreditTWD)}</div>
          </div>
        </div>
      </div>

      {/* 篩選 Tab */}
      <div className="mx-4 mt-3 flex bg-stone-100 rounded-xl p-1 gap-1">
        {([['all', '全部'], ['cash', '現金'], ['credit', '信用卡']] as [Filter, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filter === key ? 'bg-white shadow-sm' : 'text-stone-500'}`}
            style={filter === key ? { color: meta.accent } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* 新增表單 */}
      {showForm && (
        <div className="mx-4 mt-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-100 space-y-3">
          <h2 className="font-semibold text-stone-700">
            新增{meta.label}支出 <span className="text-xs font-normal text-stone-400">（{meta.emoji} {meta.label}分頁）</span>
          </h2>
          <input type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 bg-stone-50" />

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, category: c })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                  ${form.category === c ? 'text-white' : 'bg-stone-100 text-stone-600'}`}
                style={form.category === c ? { background: meta.accent } : {}}>
                {c}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setForm({ ...form, paymentMethod: 'cash' })}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                ${form.paymentMethod === 'cash' ? 'text-white' : 'bg-stone-100 text-stone-600'}`}
              style={form.paymentMethod === 'cash' ? { background: meta.accent } : {}}>
              💵 現金
            </button>
            <button onClick={() => setForm({ ...form, paymentMethod: 'credit' })}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                ${form.paymentMethod === 'credit' ? 'text-white' : 'bg-stone-100 text-stone-600'}`}
              style={form.paymentMethod === 'credit' ? { background: meta.accent } : {}}>
              💳 信用卡
            </button>
          </div>

          <div className="flex gap-2">
            <input type="number" placeholder="金額" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />
            <select value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as 'JPY' | 'TWD' })}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50">
              <option value="JPY">JPY ¥</option>
              <option value="TWD">TWD NT$</option>
            </select>
          </div>

          {showTxRateField && (
            <div>
              <label className="text-xs text-stone-400 mb-1 block">
                當時匯率（選填，不填用預設 {exchangeRate}）
              </label>
              <input type="number" step="0.001" placeholder={`例：${exchangeRate}`}
                value={form.txRate}
                onChange={(e) => setForm({ ...form, txRate: e.target.value })}
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />
              {form.amount && (
                <p className="text-xs mt-1" style={{ color: meta.accent }}>
                  ≈ NT$ {fmt(Number(form.amount) * (parseFloat(form.txRate) || exchangeRate))}
                </p>
              )}
            </div>
          )}

          <input placeholder="備註（選填）" value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50" />

          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 text-white rounded-xl py-2 text-sm font-medium"
              style={{ background: meta.accent }}>新增</button>
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-2 text-sm font-medium">取消</button>
          </div>
        </div>
      )}

      {/* 支出列表 */}
      <div className="px-4 py-4 space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-5xl mb-3">{meta.emoji}</div>
            <p className="text-sm">還沒有{meta.label}記錄</p>
            <p className="text-xs mt-1">點右上角 + 開始記帳</p>
          </div>
        ) : (
          sorted.map((item) => (
            <div key={item.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100 flex items-center gap-3">
              <div className="text-lg leading-none">
                {item.paymentMethod === 'credit' ? '💳' : '💵'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: meta.chipBg, color: meta.chipText }}>
                    {item.category}
                  </span>
                  <span className="text-xs text-stone-400">{item.date}</span>
                </div>
                {item.note && (
                  <div className="text-sm text-stone-600 mt-1 truncate">{item.note}</div>
                )}
                {item.txRate && item.currency === 'JPY' && (
                  <div className="text-xs text-stone-400 mt-0.5">匯率 {item.txRate}</div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-stone-700 text-sm">
                  {item.currency === 'JPY' ? '¥' : 'NT$'} {item.amount.toLocaleString()}
                </div>
                {item.currency === 'JPY' && (
                  <div className="text-xs text-stone-400">≈ NT$ {fmt(toTWD(item))}</div>
                )}
              </div>
              <button onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: item.id })}
                className="text-stone-300 hover:text-stone-500 text-lg leading-none">×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
