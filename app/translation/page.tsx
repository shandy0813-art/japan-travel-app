'use client';

import { useState } from 'react';

const PHRASEBOOK = [
  { category: '基本禮貌', items: [
    { jp: 'ありがとうございます', romaji: 'Arigatou gozaimasu', zh: '謝謝您' },
    { jp: 'すみません', romaji: 'Sumimasen', zh: '不好意思／打擾了' },
    { jp: 'はい／いいえ', romaji: 'Hai / Iie', zh: '是／不是' },
    { jp: 'わかりません', romaji: 'Wakarimasen', zh: '我不懂' },
    { jp: '英語を話せますか？', romaji: 'Eigo wo hanasemasu ka?', zh: '你會說英文嗎？' },
  ]},
  { category: '餐廳點餐', items: [
    { jp: 'これをください', romaji: 'Kore wo kudasai', zh: '我要這個' },
    { jp: 'メニューをください', romaji: 'Menyuu wo kudasai', zh: '請給我菜單' },
    { jp: 'お水をください', romaji: 'Omizu wo kudasai', zh: '請給我水' },
    { jp: 'お会計をください', romaji: 'Okaikei wo kudasai', zh: '請結帳' },
    { jp: 'おいしいです', romaji: 'Oishii desu', zh: '很好吃' },
    { jp: 'アレルギーがあります', romaji: 'Arerugii ga arimasu', zh: '我有過敏' },
  ]},
  { category: '交通詢問', items: [
    { jp: '〇〇はどこですか？', romaji: '〇〇 wa doko desu ka?', zh: '〇〇在哪裡？' },
    { jp: '電車の乗り方を教えてください', romaji: 'Densha no norikata wo oshiete kudasai', zh: '請教我怎麼搭電車' },
    { jp: 'ここに行きたいです', romaji: 'Koko ni ikitai desu', zh: '我想去這裡（搭配地圖）' },
    { jp: 'タクシーをお願いします', romaji: 'Takushii wo onegaishimasu', zh: '請叫計程車' },
    { jp: '〇〇駅まで行ってください', romaji: '〇〇eki made itte kudasai', zh: '請到〇〇站' },
  ]},
  { category: '購物', items: [
    { jp: 'いくらですか？', romaji: 'Ikura desu ka?', zh: '多少錢？' },
    { jp: 'カードで払えますか？', romaji: 'Kaado de haraemasu ka?', zh: '可以刷卡嗎？' },
    { jp: '免税できますか？', romaji: 'Menzei dekimasu ka?', zh: '可以退稅嗎？' },
    { jp: '袋をください', romaji: 'Fukuro wo kudasai', zh: '請給我袋子' },
  ]},
  { category: '緊急用語', items: [
    { jp: '助けてください！', romaji: 'Tasukete kudasai!', zh: '請幫助我！' },
    { jp: '病院はどこですか？', romaji: 'Byouin wa doko desu ka?', zh: '醫院在哪裡？' },
    { jp: '警察を呼んでください', romaji: 'Keisatsu wo yonde kudasai', zh: '請叫警察' },
    { jp: '財布をなくしました', romaji: 'Saifu wo nakushimashita', zh: '我的錢包掉了' },
    { jp: '気分が悪いです', romaji: 'Kibun ga warui desu', zh: '我不舒服' },
  ]},
];

const EMERGENCY = [
  {
    title: '日本緊急電話',
    color: 'red',
    items: [
      { label: '警察', value: '110', note: '遇到犯罪、事故' },
      { label: '救護車 / 消防', value: '119', note: '受傷、火災、急病' },
    ],
  },
  {
    title: '台灣官方聯絡',
    color: 'blue',
    items: [
      { label: '外交部急難救助（24小時）', value: '0800-085-095', note: '從台灣撥打' },
      { label: '外交部急難救助（海外）', value: '+886-800-085-095', note: '從日本撥打' },
      { label: '台北駐日經濟文化代表處（東京）', value: '+81-3-3280-7811', note: '週一至週五辦公時間' },
      { label: '台灣駐大阪辦事處', value: '+81-6-6443-8481', note: '關西地區' },
      { label: '台灣駐福岡辦事處', value: '+81-92-771-2421', note: '九州地區' },
      { label: '台灣駐札幌辦事處', value: '+81-11-222-2930', note: '北海道地區' },
    ],
  },
  {
    title: '實用提醒',
    color: 'yellow',
    items: [
      { label: '護照遺失', value: '', note: '立刻到最近警察局報案，取得報案證明後聯繫代表處補發' },
      { label: '信用卡遺失', value: '', note: '致電銀行客服掛失，各銀行背面均有海外客服號碼' },
      { label: '就醫費用', value: '', note: '日本就醫費用高，務必先購買旅遊平安險並隨身攜帶保單' },
    ],
  },
];

export default function ToolsPage() {
  const [tab, setTab]           = useState<'phrases' | 'emergency'>('phrases');
  const [search, setSearch]     = useState('');
  const [openCategory, setOpen] = useState<string | null>('基本禮貌');
  const [copied, setCopied]     = useState<string | null>(null);

  const filtered = search
    ? PHRASEBOOK.map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (i) =>
            i.zh.includes(search) ||
            i.jp.includes(search) ||
            i.romaji.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((cat) => cat.items.length > 0)
    : PHRASEBOOK;

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 pt-3 pb-0">
        <h1 className="text-lg font-bold text-gray-900 mb-2">工具</h1>
        {/* 分頁切換 */}
        <div className="flex">
          <button
            onClick={() => setTab('phrases')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors
              ${tab === 'phrases' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}
          >
            日文速查
          </button>
          <button
            onClick={() => setTab('emergency')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors
              ${tab === 'emergency' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-400'}`}
          >
            緊急資訊
          </button>
        </div>
      </div>

      {/* 日文速查 */}
      {tab === 'phrases' && (
        <div>
          <div className="px-4 pt-3 pb-1">
            <input
              type="search"
              placeholder="搜尋中文、日文或羅馬拼音…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none"
            />
          </div>
          <div className="px-4 py-3 space-y-3">
            {filtered.map((cat) => (
              <div key={cat.category}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpen(openCategory === cat.category ? null : cat.category)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="font-semibold text-gray-800 text-sm">{cat.category}</span>
                  <span className={`text-gray-400 transition-transform text-xs
                    ${openCategory === cat.category ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openCategory === cat.category && (
                  <div className="divide-y divide-gray-50">
                    {cat.items.map((item) => (
                      <div key={item.jp} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-base">{item.jp}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{item.romaji}</div>
                            <div className="text-sm text-red-600 mt-0.5">{item.zh}</div>
                          </div>
                          <button
                            onClick={() => copy(item.jp)}
                            className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                            {copied === item.jp ? '✓' : '複製'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-sm">找不到相關句型</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 緊急資訊 */}
      {tab === 'emergency' && (
        <div className="px-4 py-4 space-y-4">
          {EMERGENCY.map((section) => (
            <div key={section.title}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-4 py-2.5 border-b border-gray-100
                ${section.color === 'red' ? 'bg-red-50' :
                  section.color === 'blue' ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                <span className={`text-xs font-bold
                  ${section.color === 'red' ? 'text-red-600' :
                    section.color === 'blue' ? 'text-blue-600' : 'text-yellow-700'}`}>
                  {section.title}
                </span>
              </div>
              {section.items.map((item) => (
                <div key={item.label}
                  className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
                  {item.value ? (
                    <a href={`tel:${item.value.replace(/-/g, '')}`}
                      className="text-base font-bold text-red-600">
                      {item.value}
                    </a>
                  ) : null}
                  <div className="text-xs text-gray-400 mt-0.5">{item.note}</div>
                </div>
              ))}
            </div>
          ))}
          <p className="text-center text-xs text-gray-400 pb-2">
            出發前請確認最新代表處電話
          </p>
        </div>
      )}
    </div>
  );
}
