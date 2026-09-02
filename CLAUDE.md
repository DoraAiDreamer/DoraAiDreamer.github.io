# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal **Jekyll blog** deployed on GitHub Pages (`DoraAiDreamer.github.io`, user site — pushing to `master` triggers GitHub's Jekyll build). Content is Chinese-language tech/interview-prep posts (Java, big data, ML, networking). The site is built on the **Hux Blog** theme (huxpro), carried through the ckjcode/BY blog boilerplate. Branding has been rebranded to **DoraAiDreamer** (site title, SEO, email `doraaidreamer@foxmail.com`, GitHub links, PWA manifest, and post `author:`).

## Commands

```bash
jekyll serve          # local dev server at http://127.0.0.1:4000 with live rebuild (hard-refresh browser)
jekyll build          # writes generated site to _site/
jekyll build --destination /tmp/xxx   # verify build without touching committed _site/
grunt                 # legacy asset build (see caveat below) — effectively unused
npm run watch         # grunt watch + static server on :8020 + jekyll serve -w
npm run push          # git push origin master --tag (deploys via GitHub Pages)
```

There is **no Gemfile**; Jekyll must be installed manually. On macOS system Ruby 2.6, the current (Ruby 3+-only) gem versions of `ffi`, `i18n`, `public_suffix` fail to install — pin `ffi -v 1.16.3`, `i18n -v 1.14.8`, `public_suffix -v 5.1.1` first, then `jekyll -v 3.9.5`, `jekyll-paginate`, `jekyll-theme-slate`, `kramdown-parser-gfm` (all `--user-install`). Config is Jekyll 3-era (`plugins:` key, kramdown + rouge, GFM input).

## Architecture

- **`_posts/`** — published articles. Markdown files named `YYYY-MM-DD-slug.md` (Chinese titles fine) with YAML front matter: `layout: post`, `title`, `subtitle`, `date`, `author`, `category`, `header-img`, `catalog: true` (enables the auto-generated side table-of-contents), and `tags:` (drives the tag cloud on `tags.html` and the chips on homepage cards).
- **Categories** — every post has a `category:` front-matter field, one of five: `大数据` (12), `Java 面试` (8), `机器学习` (5), `网络与安全` (4), `工具与其他` (4). These group the homepage cards via `site.categories[cat]`. To add a category, add the `category:` value to the post AND register it in the `cat_list`/`icon_list` arrays at the top of `index.html` (order and emoji there control section order).
- **Homepage** — `index.html` no longer uses the paginator; it renders a **card per post grouped by category** (Bootstrap grid, 2-up on desktop). Card subtitle falls back to the post excerpt when `subtitle` is blank. Card styles are defined inline in a `<style>` block at the top of `index.html`.
- **`_postsBackups/`** — archive of the original theme author's old posts. Jekyll does **not** render it (only `_posts/` is published); treat as cold storage.
- **`_layouts/`** — `default.html` (chrome: includes `nav.html`, `head.html`, `footer.html`), `post.html` (article + optional side catalog, Gitalk/Disqus hooks, AnchorJS), `page.html`, `keynote.html` (HTML5 slide-deck layout for presentation posts).
- **`_includes/`** — `head.html` (CSS/CDN includes, PWA manifest, MathJax), `nav.html`, `footer.html` (JS includes).
- **Static pages at root** — `index.html` (category cards + a vLLM banner), `vllm.html` (the `/vllm/` column), `about.html`, `tags.html` (tag cloud), `404.html`, `offline.html`, `feed.xml`. Any root page with a `title:` in its front matter automatically appears in the nav (`nav.html` iterates `site.pages`).
- **vLLM tutorial column** — `vllm.html` is a card index for the external repo [DoraAiDreamer/vllm-0.21.0-chinese-tutorial](https://github.com/DoraAiDreamer/vllm-0.21.0-chinese-tutorial) (branch `master`, Chinese source-walkthrough under `docs/overview/`). Cards link out to GitHub blob URLs (`target="_blank"`) — content is **not** copied into the blog and stays single-sourced in that repo. The `{{ repo }}`/`{{ repo_root }}` Liquid vars at the top of `vllm.html` hold the blob base URL; when the tutorial adds/renames articles, update the cards there to match.
- **`_config.yml`** is the feature switchboard: sidebar, `featured-tags`, RSS, Gitalk/Disqus comments, Baidu/Google Analytics, AnchorJS, friends links, PWA/service worker. Comments and analytics are currently commented out.
- **PWA** — `sw.js` (precache + runtime cache with a hostname whitelist; bump `PRECACHE` version when cached assets change), `pwa/manifest.json`, enabled by `service-worker: true` in `_config.yml`.

## Gotchas

- **`permalink` is pinned to date-based (`/:year/:month/:day/:title/`) on purpose.** Jekyll's `pretty` preset expands to `/:categories/:year/:month/:day/:title/`, so the moment posts carry a `category:` field their URLs would gain a `/%E5%A4%A7%E6%95%B0%E6%8D%AE/`-style prefix and every existing link would break. Do not switch back to `pretty`.
- **Posts must have valid YAML front matter to be published.** A few legacy posts were missing it (one had a stray opening ` ``` ` fence before the `---`); Jekyll silently skips files with no front matter, so a post that doesn't appear usually means its header is malformed.
- **Liquid chokes on `{{ }}` inside post content** (e.g. LaTeX like `{{(x-\mu)^2 \over ...}}`); it's interpreted as a Liquid tag and emits a syntax warning / drops the expression. Write such math with single braces or wrap in `{% raw %}`…`{% endraw %}`.
- **The Grunt asset pipeline is stale and does not feed the site.** Templates load `css/hux-blog.min.css` and `js/hux-blog.min.js`, but `Gruntfile.js` builds `by-blog.*` from `less/by-blog.less` (derived from `package.json` `name: "by-blog"`) — a file that doesn't exist. To change site styles/scripts, edit `css/hux-blog.css` / `js/hux-blog.js` and their `.min.*` counterparts directly (or fix the names in `package.json`/Gruntfile first). `less/hux-blog.less` is the theme LESS source but is not wired to the served CSS.
- **Build artifacts and dependencies are committed**: `_site/`, `node_modules/`, and `.jekyll-cache/` are tracked in git because `.gitignore` is effectively empty. Never treat `_site/` as source — GitHub Pages rebuilds from the Jekyll sources regardless.
- `exclude:` in `_config.yml` lists `less`, `node_modules`, etc. from the Jekyll build; keep tooling files out of `_posts/` so they aren't published.
