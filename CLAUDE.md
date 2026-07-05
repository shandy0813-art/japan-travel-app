@AGENTS.md

# Japan Travel App

A personal-use PWA for a 2026 Japan trip: expense tracking, a Japanese
phrasebook/emergency-contacts tool, and a photo-lookup shortcut. Traditional
Chinese (zh-TW) UI throughout. No backend — everything is static and
client-side.

## Tech stack

- **Next.js 16.2.6** (App Router), statically exported (`output: 'export'` in
  `next.config.ts`) — there is no server runtime, no API routes, no SSR at
  request time. Everything must work as pre-rendered HTML + client JS.
- **React 19.2.4**, TypeScript (strict mode), Tailwind CSS v4 (via
  `@tailwindcss/postcss`, imported through `app/globals.css`).
- `next-pwa` is in `package.json` but **not actually wired up** — the service
  worker is hand-written at `public/sw.js` and registered manually by
  `app/components/SwRegister.tsx`. Don't assume next-pwa config exists;
  edit `public/sw.js` directly for caching/PWA behavior changes.
- Deployed to **GitHub Pages** via `.github/workflows/deploy.yml` (push to
  `main` → `npm ci && npm run build` → upload `out/` as the Pages artifact).
  `basePath: '/japan-travel-app'` and `trailingSlash: true` in
  `next.config.ts` matter because of this — don't remove them or internal
  links/assets will 404 on the deployed site.

## Project structure

```
app/
  layout.tsx           Root layout: wraps everything in AppProvider,
                        renders BottomNav + SwRegister, sets PWA metadata.
  page.tsx              "/" — immediately redirects to /accounting (see below).
  context/AppContext.tsx  Global state: expenses + settings, backed by
                        localStorage (see State management below).
  components/
    BottomNav.tsx       Bottom tab bar. Nav items are hardcoded here — this
                        is the source of truth for which routes are "real"
                        pages in the app today.
    SwRegister.tsx      Registers public/sw.js on mount.
  accounting/page.tsx   記帳 — expense tracker (cash + credit, JPY/TWD,
                        per-transaction exchange rate override). Main feature.
  translation/page.tsx  翻譯 — static phrasebook + emergency contacts
                        (Japan police/ambulance, Taiwan representative
                        offices). All data is hardcoded in this file.
  photo/page.tsx        拍照辨識 — just deep-links out to lens.google.com.
                        No API integration currently (see below).
  settings/page.tsx     設定 — exchange rate, Gemini API key input, data
                        stats, clear-data.
  itinerary/page.tsx    Redirect-only stub → /accounting.
  packing/page.tsx      Redirect-only stub → /accounting.
public/
  sw.js                 Hand-written service worker (stale-while-revalidate
                        for same-origin GET requests).
  manifest.json          PWA manifest.
generate-icons.mjs / .cjs  One-off scripts to generate public/icon-*.png via
                        node-canvas. Not part of the build; run manually.
```

### Dead / stale code to be aware of

- `itinerary/` and `packing/` were removed as features (see git history:
  "改版：移除行程/行李") but kept as routes that redirect to `/accounting`,
  presumably so old bookmarks/PWA shortcuts don't break. They are **not**
  linked from `BottomNav`.
- `public/sw.js`'s `STATIC_ASSETS` list and `public/manifest.json`'s
  description still reference `/itinerary` / trip itinerary features that no
  longer exist in the UI. Treat this as known drift, not a template to copy.
- `settings/page.tsx` still has a Gemini API key field and persists it to
  `localStorage` (`gemini-api-key`), but `photo/page.tsx` no longer calls
  Gemini at all — it's just a link to Google Lens (git history: "拍照辨識改為
  Google Lens 連結，免 API Key"). The API key setting is currently unused
  dead weight; if you touch the photo feature, decide whether to remove the
  settings field or wire it back up rather than leaving both half-states.

## State management

- Single `AppContext` (`app/context/AppContext.tsx`) using
  `useReducer` + `localStorage`, no external state library.
- Storage key is versioned: `japan-travel-app-v2`. If you change the shape
  of `AppState`, bump this key (or write a migration) rather than mutating
  the old shape in place — there's no migration logic today, so a shape
  change with the same key will silently `LOAD_STATE` mismatched data.
- Load-then-save pattern: a `loaded` ref guards against writing the default
  state back to localStorage before the initial read completes. Preserve
  this pattern if you add new persisted slices.
- `ExpenseItem.txRate` is optional and only meaningful when
  `paymentMethod === 'credit' && currency === 'JPY'` — it lets a single
  transaction override the global `settings.exchangeRate` (credit card
  purchases get billed at the bank's rate on the transaction date, not
  today's rate).

## Conventions

- All UI copy is Traditional Chinese. Keep new copy consistent with this;
  don't introduce English-only strings or Simplified Chinese.
- Every page is a client component (`'use client'` at the top) — there's no
  server component data-fetching pattern in this app since it's a fully
  static export with `localStorage`-only persistence.
- Styling is inline Tailwind utility classes only; no CSS modules, no
  component library. Primary brand color is `#c47a7a` (dusty rose), used
  directly as arbitrary Tailwind values (`bg-[#c47a7a]`, `text-[#c47a7a]`)
  rather than a Tailwind theme token — match this existing pattern rather
  than introducing a new one, or migrate all usages together if you add a
  theme token.
- Icons are hand-rolled inline SVGs (see `BottomNav.tsx`), not an icon
  library — no `lucide-react`/`heroicons` dependency exists in
  `package.json`.
- Path alias `@/*` → project root is configured in `tsconfig.json` but
  existing code uses relative imports (`../context/AppContext`) throughout;
  either is fine, but check for consistency within the file you're editing.

## Development workflow

```
npm run dev     # next dev
npm run build   # next build -> static export to out/
npm run start   # next start (not used in deployment; deployment serves the
                 # static `out/` export via GitHub Pages, not `next start`)
npm run lint    # eslint
```

- There are no automated tests in this repo.
- Because of `output: 'export'`, avoid anything that needs a Node.js
  server at runtime (API routes, middleware, dynamic route revalidation,
  `next/image` optimization — `images.unoptimized: true` is already set).
- Because `basePath` is set, use `next/link` and `next/navigation` (as
  existing pages do) rather than raw `<a href="/foo">` for internal links,
  so the base path is applied automatically.
- This project pins bleeding-edge Next.js/React majors (16.x / 19.x). See
  `AGENTS.md` for the note on checking `node_modules/next/dist/docs/` for
  version-specific API changes before assuming APIs from older Next.js
  knowledge still apply — this matters more here than in a typical repo.
