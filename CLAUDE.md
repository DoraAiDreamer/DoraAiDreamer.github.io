# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal tech blog built with **Astro 5** (migrated from Jekyll in Sep 2026). Chinese-language notes with heavy inline-SVG figures and an interactive inference column. Deploys to GitHub Pages via GitHub Actions (`master` → Actions build → Pages).

## Commands

```bash
npm install
npm run dev       # http://localhost:4321, HMR
npm run build     # static output to dist/
npm run preview
```

Node 22. No Ruby/Gem toolchain (that was the old Jekyll site).

## Architecture

- **Content collections** — `src/content.config.ts` defines the `blog` collection with a zod schema. Valid `category` values live in the schema enum (`大模型 / 机器学习 / 大数据 / 网络与安全 / 工具与其他`); an invalid category or missing front-matter field fails the build. Posts are `src/content/blog/<slug>.md` (filename = slug; URL `/blog/<slug>/`). Front matter: `title`, `subtitle?`, `date`, `author?`, `category`, `tags[]`.
- **Pages** (`src/pages/`):
  - `index.astro` — homepage; groups posts by category (a `cats` array drives order/icon/description/anchor) and renders cards. 大模型 and 机器学习 sections also inject chapter/column entry cards.
  - `blog/[slug].astro` — dynamic post page (renders markdown; `toc` enabled).
  - `llm.astro` / `ml.astro` — the 图解大模型 / 图解机器学习 chapter hubs (inline SVG figures + tables).
  - `inference.astro` — 推理加速 column landing (24 cards linking to the viewer).
  - `inference/view.astro` — markdown viewer: client-side JS fetches raw Markdown at runtime from `raw.githubusercontent.com/DoraAiDreamer/vllm-0.21.0-chinese-tutorial/...` and renders with marked + DOMPurify + highlight.js (CDN). Content stays in that repo, not copied.
- **Layout** (`src/layouts/BaseLayout.astro`) — three-column doc layout: left = topic/category sidebar (hardcoded `sideGroups`), center = content, right = `PageTOC` (rendered only when `toc={true}`). Nav includes the `DoraemonLogo` SVG.
- **Components** (`src/components/`):
  - `DoraemonLogo.astro` — inline SVG Doraemon avatar for the nav.
  - `TemperatureIsland.astro` — interactive softmax/temperature demo (client `<script>`, scoped styles); an Astro "island" (only page loading it ships JS).
  - `PageTOC.astro` — builds right-hand TOC from h2/h3 with IntersectionObserver scroll-spy.
  - `ThemeToggle.astro` — dark/light toggle (persists to localStorage; `is:inline` anti-FOUC script in BaseLayout head).
- **Styling** — `src/styles/global.css` only. CSS custom properties on `:root` for light / `[data-theme="dark"]` for dark (plus `prefers-color-scheme`). Shiki `github-dark` via `astro.config.mjs`.
- **Images** — `public/img/`; migrated posts reference absolute `/img/...` paths (relative `img/`, `../img/` were normalized).

## Conventions & gotchas

- Front-matter string values are double-quoted in generated posts (titles contain half-width colons that break unquoted YAML).
- Figures in chapters/posts are inline `<svg>` inside `<figure>` + `<figcaption>`; keep SVG well-formed XML and avoid stray `{ }` (Astro template syntax) inside raw markup.
- Right TOC (`PageTOC`) and left sidebar auto-hide on narrow screens (<1080px / <820px).
- Category counts/order on the homepage derive from the collection + `cats` array; add a category in BOTH `content.config.ts` (enum) and the `cats`/`sideGroups` lists to surface it.
- Deploy: push to `master`; the Actions workflow builds `dist/` and deploys. Requires repo Settings → Pages → Source = "GitHub Actions" (one-time).
