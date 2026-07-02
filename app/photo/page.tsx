'use client';

import { useState, useRef } from 'react';

interface Result {
  name: string;
  description: string;
  price?: string;
}

export default function PhotoPage() {
  const [preview, setPreview]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function handleRecognize() {
    if (!preview) return;
    const apiKey = localStorage.getItem('gemini-api-key') || 'AIzaSyBKwJ-tfNuHyCFHoTYxbUOsn8-9j3CqZ5A';


    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const [, b64] = preview.split(',');
      const mimeType = preview.split(';')[0].replace('data:', '');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: b64 } },
                { text: '這是一張在日本拍的商品照片。請用繁體中文簡潔說明：\n1. 【商品名稱】\n2. 【用途/說明】（1-2句）\n3. 【口味/成分】（若為食品）\n4. 【標價】（若照片中有看到價格）\n\n格式請依上面項目條列，沒有的項目就省略。' },
              ],
            }],
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '無法取得結果';
      setResult(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">拍照辨識</h1>
        <p className="text-xs text-gray-400">拍商品照片，AI 幫你看懂是什麼</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 拍照 / 上傳區 */}
        <div
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors
            ${preview ? 'border-transparent' : 'border-gray-200 hover:border-red-300'}`}
          style={{ minHeight: 220 }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full object-contain max-h-72 rounded-2xl" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-14 text-gray-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 mb-3 text-gray-300">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <p className="text-sm font-medium">點此拍照或選圖片</p>
              <p className="text-xs mt-1">支援 JPG / PNG</p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />

        {/* 操作按鈕 */}
        {preview && (
          <div className="flex gap-2">
            <button
              onClick={() => { setPreview(null); setResult(null); setError(null); }}
              className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm font-medium"
            >
              重新選圖
            </button>
            <button
              onClick={handleRecognize}
              disabled={loading}
              className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {loading ? '辨識中…' : 'AI 辨識'}
            </button>
          </div>
        )}

        {/* 載入中 */}
        {loading && (
          <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400">
            <div className="text-3xl mb-2 animate-pulse">🔍</div>
            <p className="text-sm">AI 正在分析中，請稍候…</p>
          </div>
        )}

        {/* 錯誤 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 辨識結果 */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✅</span>
              <h2 className="font-semibold text-gray-800">辨識結果</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
