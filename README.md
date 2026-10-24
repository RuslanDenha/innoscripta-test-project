# innoscripta test project

A news aggregator built with **React and TypeScript**. It pulls articles from three news APIs, lets you search and filter them, and gives you a personal feed built from the sources, categories and authors you follow. It works on phones as well as desktops.

**Sources:** [NewsAPI.org](https://newsapi.org), [The Guardian](https://open-platform.theguardian.com) and [The New York Times](https://developer.nytimes.com).

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Getting API keys](#getting-api-keys)
- [Running with Docker](#running-with-docker)
- [Running locally without Docker](#running-locally-without-docker)
- [Scripts](#scripts)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Known limitations](#known-limitations)
- [Third-party code](#third-party-code)

---

## Features

### Article search and filtering

- **Keyword search** across all selected sources.
- **Filters:** date range (from / to), category, and source (NewsAPI, The Guardian, The New York Times). Leaving every source unticked searches all of them.
- **Outlet filter** above the results. NewsAPI returns articles from many outlets (BBC News, CNN, …), and this narrows the list to one of them.
- **Automatic search.** Clicked filters (category, sources) apply immediately; typed values (keyword, dates) search 600 ms after you stop typing. Enter or **Search** searches at once.
- **Stale requests are cancelled.** When a new search starts, the previous one's requests are aborted, so outdated results never replace newer ones.
- **Clear filters** resets everything in one click.

### Personalized news feed

- A **My feed** tab, open by default, with a **Customize** panel to choose:
  - **Sources:** any combination of the three APIs.
  - **Categories:** Business, Technology, Science, Health, Sports, Entertainment (several at once).
  - **Authors:** type a name, or pick from authors that appeared in articles you've already loaded.
- The feed shows articles from your sources that are in one of your categories **or** written by one of your authors. With nothing selected, it's the latest news from all sources.
- Preferences are saved in the browser (`localStorage`) when you press **Save feed**, so they survive reloads. **Cancel** discards unsaved changes.

### Mobile-responsive design

- Single-column layout on narrow screens, with full-width images and no horizontal scrolling.
- Search filters collapse behind a **Filters** button that shows how many filters are active.
- Feed settings use two columns and full-width buttons on phones.
- Light and dark mode follow the system setting.

### News cards

- The whole card is clickable (the "stretched link" pattern also used by The Guardian), while keyboards and screen readers still meet a single link named after the headline.
- Images that fail to load are hidden instead of showing a broken image.
- Titles and summaries are cut off after 3 lines.
- Dates are relative ("5 minutes ago", "yesterday"); hover for the full date and time.

---

## Quick start

1. Get free API keys for the three sources (see [Getting API keys](#getting-api-keys)).
2. Create a `.env.local` file from the example and add the keys:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   VITE_NEWSAPI_KEY=your-newsapi-key
   VITE_GUARDIAN_KEY=your-guardian-key
   VITE_NYT_KEY=your-nyt-key
   ```

3. Run it [with Docker](#running-with-docker) or [locally](#running-locally-without-docker).
4. Open **http://localhost:8080** (Docker) or **http://localhost:5173** (local).

The app still starts if a key is missing: that source shows an error message above the results and the others keep working.

---

## Getting API keys

All three are free. Each takes a few minutes.

| Source | Where to sign up | Variable |
|---|---|---|
| NewsAPI.org | https://newsapi.org/register. The key is shown right after signing up. | `VITE_NEWSAPI_KEY` |
| The Guardian | https://open-platform.theguardian.com/access. Choose **Register for a developer key**; the key arrives by email. | `VITE_GUARDIAN_KEY` |
| The New York Times | https://developer.nytimes.com: sign in, open **My Apps → New App**, turn on **Article Search API** and save. The key is on the app's page. | `VITE_NYT_KEY` |

> **Keep keys private.** `.env.local` is listed in `.gitignore` and is never committed. Use `.env.example` to show which variables are needed.

---

## Running with Docker

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with the Compose plugin) and a `.env.local` file with your keys (see [Quick start](#quick-start)).

### With Docker Compose (recommended)

```bash
docker compose --env-file .env.local up --build
```

Open **http://localhost:8080**. Stop it with `Ctrl+C`, or run it in the background with `-d` and stop it later with `docker compose down`.

### With plain Docker

```bash
docker build \
  --build-arg VITE_NEWSAPI_KEY=your-newsapi-key \
  --build-arg VITE_GUARDIAN_KEY=your-guardian-key \
  --build-arg VITE_NYT_KEY=your-nyt-key \
  -t innoscripta-news .
```

```bash
docker run --rm -p 8080:80 innoscripta-news
```

Open **http://localhost:8080**.

### How the image works

| File | Role |
|---|---|
| `Dockerfile` | Two stages. A `node:24-slim` stage runs `npm ci` and `npm run build` (type check plus Vite build). An `nginx:1.27-alpine` stage serves only the built files, so the final image contains no Node.js, source code or `node_modules`. |
| `nginx.conf` | Serves the app, sends unknown paths to `index.html`, caches hashed files in `/assets/` for a year and compresses responses. |
| `docker-compose.yml` | Builds the image with the keys from the file passed with `--env-file`, and maps port 8080 to the container's port 80. |
| `.dockerignore` | Keeps `node_modules`, `dist`, `.git` and every `.env*` file except `.env.example` out of the build, so keys never end up in the image as files. |

### Things to know

- **Keys are needed at build time.** Vite writes `VITE_*` variables into the JavaScript bundle when the app is built, so they are passed as build arguments, not when the container starts. **After changing a key, rebuild** (`--build` with Compose, or `docker build` again).
- **A missing key doesn't stop the build.** Compose prints a warning such as `The "VITE_NYT_KEY" variable is not set`, and the app shows an error for that source while the others keep working. If you see all three warnings, the `--env-file .env.local` part is probably missing.
- **Open the app on `localhost`.** NewsAPI's free plan only accepts browser requests from `localhost`, so use `http://localhost:8080`, not a network IP or another hostname.
- **Port 8080 already in use?** Change the left side of `"8080:80"` in `docker-compose.yml` (or of `-p 8080:80`), for example to `"3000:80"`, and open that port instead.

---

## Running locally without Docker

**Requirements:** Node.js 20.19+ or 22.12+ (required by Vite) and npm.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Vite reads `.env.local` only when it starts, so restart `npm run dev` after changing keys.

To build and serve the production version locally:

```bash
npm run build
```

```bash
npm run preview
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with hot reload on http://localhost:5173 |
| `npm run build` | Type-checks with `tsc`, then builds the production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` folder locally |
| `npm run typecheck` | Runs the TypeScript checker only |

---

## How it works

### One article shape for three APIs

Each API returns a different format. Every provider in `src/news/providers/` converts its response into one shared `Article` type (`src/news/types.ts`):

```ts
interface Article {
  id: string;            // unique across sources, e.g. "nyt:nyt://article/…"
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  author: string | null;
  publishedAt: string;   // ISO 8601
  source: string;        // outlet, e.g. "BBC News", "The Guardian"
  category: string | null;
  provider: "newsapi" | "guardian" | "nyt";
}
```

Only `title`, `url`, `publishedAt` and `source` are guaranteed, so the UI treats every other field as optional.

Source-specific clean-up done during the conversion:

- **NewsAPI:** `[Removed]` placeholder articles are dropped, and the trailing " - Outlet name" is removed from titles because the card already shows the outlet.
- **The Guardian:** summary, image and author are requested with `show-fields`, and HTML tags are stripped from summaries.
- **NYT:** both old (relative paths) and new (absolute URLs) image formats are handled, "By " is removed from bylines, and dates are normalized to ISO 8601.

### Mapping filters onto each API

| Filter | NewsAPI | The Guardian | NYT |
|---|---|---|---|
| Keyword | `q` | `q` | `q` |
| Dates | `from` / `to` (on `/everything`) | `from-date` / `to-date` | `begin_date` / `end_date` |
| Category | `category` (on `/top-headlines`, one request per category) | `section`, several joined with `\|` | `fq=section.name:(…)` |

Categories are defined once in `src/news/categories.ts` and mapped onto each API's own sections. For example, Sports covers the Guardian's separate `sport` and `football` sections.

NewsAPI can't combine a category with dates. In that case the app requests the category's top headlines and drops any article outside the date range afterwards. The date range is applied again in the browser for every source, as a safety net.

### Fetching

- All selected sources are requested **in parallel**. One failing source doesn't hide the others' results; its error is shown above the list.
- Results from several requests are **merged, de-duplicated by `id`** and sorted newest first.
- `useArticles` (`src/hooks/useArticles.ts`) cancels the previous load with an `AbortController` when a new one starts.

### The personalized feed

`fetchFeed` (`src/news/feed.ts`) builds the feed from the saved preferences:

1. If categories are selected, or nothing is, it fetches the latest articles in those categories from the chosen sources.
2. If authors are selected, it searches each source for the author names and keeps only articles whose byline matches. None of the APIs filter by author directly, and NYT can't combine several quoted names in one query, so it gets one request per author.
3. The results are merged, so the feed contains articles in your categories **or** by your authors.

---

## Project structure

```
src/
├── main.tsx                 App entry point
├── App.tsx                  Page layout, "My feed" / "Search" tabs
├── index.css                Theme colours, page and card styles
├── formatDate.ts            Relative dates ("2 hours ago")
├── authors.ts               Splits bylines into individual author names
├── news/                    Data layer, no React
│   ├── types.ts             Article, SearchParams, Provider, Category
│   ├── categories.ts        Shared categories mapped to each API
│   ├── http.ts              fetch wrapper: errors, rate limits, cancellation
│   ├── index.ts             fetchAllArticles, merging and de-duplication
│   ├── feed.ts              fetchFeed, saving and loading preferences
│   └── providers/           One adapter per API
│       ├── newsapi.ts
│       ├── guardian.ts
│       └── nyt.ts
├── hooks/
│   ├── useArticles.ts       Loading state and request cancellation
│   ├── useSearchFilters.ts  Search form values and derived params
│   └── useAutoSearch.ts     Instant / debounced automatic search
└── components/
    ├── FeedView.tsx         "My feed" tab
    ├── PreferencesPanel.tsx Feed customization panel
    ├── SearchView.tsx       "Search" tab
    ├── SearchForm.tsx       Keyword, dates, category, sources
    ├── Results.tsx          Errors, result count, outlet filter
    ├── ArticleList.tsx
    ├── ArticleCard.tsx
    └── ui/                  Own UI components (see below)
```

---

## Design decisions

- **No runtime libraries besides React.** The only dependencies are `react` and `react-dom`. Vite and TypeScript are used for development and building only.
- **Own UI components.** `src/components/ui/` contains Button, Input, Select, Checkbox, Tabs, Badge and Field. They are written in plain React and CSS, with styling inspired by [shadcn/ui](https://github.com/shadcn-ui/ui), and use the browser's native select, date and checkbox controls underneath, so keyboard use, screen readers and mobile date pickers keep working as usual.
- **Data layer separate from UI.** Everything in `src/news/` is plain TypeScript with no React, so the API code can be reused or tested on its own.
- **Preferences in `localStorage`.** The project is front-end only, with no backend or accounts, so the browser is where the feed settings are kept. Unreadable or blocked storage falls back to the default feed.
- **Search behaviour** follows common practice: one-click filters apply at once, typing is debounced, and old requests are cancelled. This keeps the UI responsive and limits use of the APIs' small free quotas.

---

## Known limitations

- **API keys are visible in the browser.** The keys are bundled into the front-end, as with any app that calls these APIs directly. A production app would call them through its own backend.
- **NewsAPI only works on `localhost`.** Its free Developer plan blocks browser requests from other domains, so a deployed version would need a backend or a paid plan. Its free plan also only searches roughly the last month.
- **Rate limits.** NYT allows about 5 requests a minute and NewsAPI 100 a day on free plans. When a limit is hit, that source shows "Too many requests (free API limit). Wait a minute and try again." Each followed author costs one extra NYT request.
- **Author matching is best effort.** It works well for The Guardian and NYT. NewsAPI searches article text, not bylines, so it rarely finds articles by a given author.
- **Preferences are per browser.** They don't sync across devices, and clearing site data or using a private window resets them.
- **Result count.** Each request returns the newest matching articles: up to 20 from NewsAPI and The Guardian, and 10 from NYT. There is no pagination.
