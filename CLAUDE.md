# CLAUDE.md

Instructions for AI coding agents working on this project. Read this before changing anything.
For what the app does and how to run it, see [README.md](README.md); keep both files in sync.

## What this is

A **take-home test task** for innoscripta: a news aggregator front end in **React + TypeScript**.
The brief requires exactly this, nothing more:

1. **Article search and filtering:** search by keyword, filter by date, category and source.
2. **Personalized news feed:** choose preferred sources, categories and authors.
3. **Mobile-responsive design.**
4. At least **three data sources**: NewsAPI.org, The Guardian, The New York Times.
5. **Containerized with Docker**, with clear documentation for running it in the container.

**Don't add features beyond the brief** (accounts, backend, bookmarks, infinite scroll, more
sources, theme toggle, …). Reviewers value clean code that meets every requirement over extras.
Small polish that fixes a real problem (broken images, long text) is fine.

## Hard rules

- **No libraries besides `react` and `react-dom`.** No UI kits, Tailwind, Radix, icon packages,
  date libraries, state managers, routers, axios, lodash, test frameworks, etc. Dev tooling is
  only `typescript`, `vite`, `@types/react`, `@types/react-dom`. Use browser APIs instead
  (`fetch`, `AbortController`, `Intl.RelativeTimeFormat`, `Intl.DateTimeFormat`, `DOMParser`,
  `localStorage`).
- **Never commit or print API keys.** They live in `.env.local` (gitignored). Don't put them in
  code, docs, URLs you share, or Docker image layers (`.dockerignore` excludes `.env*`).
- **Respect the free API quotas when testing:** NYT allows about **5 requests a minute**,
  NewsAPI **100 a day**, the Guardian about 1 a second. Space out manual and scripted tests
  (≈13 s between NYT calls). A 429 shows "Too many requests (free API limit)…" in the UI.
- **Mobile must keep working.** Check every UI change at 375 px wide as well as desktop, in
  light and dark mode, with no horizontal scrolling.
- Run `npm run build` (type check + build) after changes; it must pass.

## Commands

```bash
npm run dev         # http://localhost:5173, reads .env.local at startup (restart after key changes)
npm run build       # tsc --noEmit && vite build
npm run typecheck
docker compose --env-file .env.local up --build   # http://localhost:8080
```

On this machine Node comes from `fnm`, which a non-login shell doesn't load: if `npm` isn't
found, run commands through `zsh -lic '…'`. Open the app on **localhost** only: NewsAPI's free
plan rejects browser requests from any other origin.

## Architecture

```
src/news/        Data layer. Plain TypeScript, NO React imports.
  types.ts         Article, SearchParams, Provider, Category
  categories.ts    One shared category list mapped onto each API's own sections
  http.ts          getJson: fetch wrapper (errors, 429 message, abort pass-through)
  index.ts         PROVIDER_FETCHERS, fetchAllArticles, settle (merge, de-dupe, sort)
  feed.ts          fetchFeed, FeedPreferences, load/save in localStorage
  providers/       One adapter per API → Article[]
src/hooks/       useArticles (loading + AbortController), useSearchFilters, useAutoSearch
src/components/  Views and cards; ui/ holds our own UI components
```

### Data layer rules

- Every provider converts its response into the shared `Article` shape. Only `title`, `url`,
  `publishedAt` and `source` are guaranteed; treat everything else as nullable in the UI.
- `id` is prefixed with the provider (`newsapi:`, `guardian:`, `nyt:`) so it is unique across sources.
- Provider fetchers take `(params, signal?)` and must pass `signal` to `getJson` so requests can be cancelled.
- Use `settle()` to run requests in parallel: one failing source must not hide the others, and
  its error is shown per provider. Results are merged, de-duplicated by `id`, newest first.
- **No sources selected means all sources** (`resolveProviders`). Store provider lists in
  `ALL_PROVIDERS` order so equal selections compare equal.

### API quirks (verified against the live APIs, don't "simplify" them away)

| | NewsAPI | Guardian | NYT |
|---|---|---|---|
| Keyword | `q` | `q` | `q` |
| Dates | `from`/`to`, only on `/everything` | `from-date`/`to-date` | `begin_date`/`end_date` as `YYYYMMDD` |
| Category | `category` on `/top-headlines`, **one per request** | `section`, OR with `\|` | `fq=section.name:("A" "B")` |
| Author | not searchable (q matches text only) | quoted names OR-ed in `q` | **one request per author** (quoted names can't be OR-ed) |

- NewsAPI `/everything` needs a query and has no categories; `/top-headlines` has categories but
  no dates. With category + dates, fetch top headlines and filter dates afterwards.
  `fetchAllArticles` re-applies the date range to every source as a safety net.
- NewsAPI: drop `[Removed]` articles; strip the trailing " - Outlet" from titles (loose match).
- Guardian: request `show-fields=trailText,thumbnail,byline`; strip HTML from `trailText`.
- NYT: section names are e.g. `"Business"`, **not** `"Business Day"` (returns nothing). Handle both
  image formats (old relative paths need `https://www.nytimes.com/`). Remove "By " from bylines;
  normalize `+0000` offsets to ISO 8601.
- The Guardian's public `test` key no longer works; real keys are required.

### Search behaviour (agreed with the user, keep it)

- **Category and source changes search immediately**; **keyword and dates are debounced 600 ms**
  (dates too, because typing a year digit by digit fires a change per digit).
  Enter / Search searches at once and cancels any pending debounce. This lives in
  `useAutoSearch` (generic) + `isClickedFilterChange` in `SearchForm`.
- Skip a search when params equal the last search (`JSON.stringify` comparison).
- **A new load aborts the previous one** (`useArticles`). Don't add an "abort on unmount" cleanup:
  StrictMode's dev double-mount would cancel the first load and it would never retry.
- Initial loads are guarded with refs so StrictMode doesn't fire them twice (API quota).
- On phones (≤ 600 px) the search filters collapse behind a **Filters** button with an
  active-filter count.

### Personalized feed

- "My feed" is the default tab; first visit opens the Customize panel.
- Feed = articles from preferred sources that are in a preferred category **OR** by a preferred
  author. Nothing selected = latest news from all sources.
- Preferences are saved to `localStorage` (`news-feed-preferences`) **only on "Save feed"**;
  Cancel discards edits. Loading must tolerate missing, invalid or blocked storage.
- Author matching is a case-insensitive substring match on the byline, after searching by name.

## UI conventions

- **Use our own components** from `src/components/ui/` (Button, Input, Select, Checkbox, Tabs,
  Badge, Field), written in plain React + CSS (`ui.css`). Need a new one? Build it the same
  way and keep native elements underneath (native `<select>`, `<input type="date">`, checkbox)
  for accessibility.
- Icons are inline SVGs in `ui/icons.tsx`.
- Colours are CSS variables in `index.css` (neutral palette) with a
  `prefers-color-scheme: dark` override. Never hard-code colours.
- Plain CSS with BEM-ish class names (`article__body`, `ui-button--outline`). No CSS-in-JS.
- **News cards:** the title link is stretched over the whole card (Guardian pattern: one link,
  named by the headline); hide images that fail to load (`onError`); clamp title and summary to
  3 lines; show relative dates ("2 hours ago") with the full date in `title`.

## Code style

- Match the existing code: small focused modules, named helpers, short comments that explain
  *why* (API quirks, quota reasons), not what.
- Strict TypeScript; avoid `any` and non-null assertions; narrow instead.
- Components hold layout; logic goes in hooks (`src/hooks/`) or the data layer (`src/news/`).
- Keep the README's feature list, "How it works", project structure and limitations up to date
  when behaviour changes.
