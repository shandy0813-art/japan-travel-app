'use client';

export default function PhotoPage() {
  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">拍照辨識</h1>
        <p className="text-xs text-gray-400">用 Google Lens 辨識日文商品</p>
      </div>

      <div className="px-4 py-8 flex flex-col items-center gap-6">
        {/* 主按鈕 */}
        <a
          href="https://lens.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-red-600 text-white rounded-2xl py-5 flex flex-col items-center gap-2 shadow-sm active:opacity-80"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span className="text-base font-semibold">開啟 Google Lens</span>
          <span className="text-xs opacity-80">免費・不需設定</span>
        </a>

        {/* 使用說明 */}
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm">使用步驟</h2>
          {[
            ['📷', '點上方按鈕開啟 Google Lens'],
            ['🎯', '對準商品拍照或從相簿選圖'],
            ['🔍', 'Google 自動辨識並顯示中文說明'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <span className="text-sm text-gray-600">{text}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center">
          第一次使用可能需要允許相機權限
        </p>
      </div>
    </div>
  );
}
