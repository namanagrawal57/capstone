# WKND Capstone — Go-Live & Operations

This document covers taking the site to a production host and the operational
notes discovered while building it.

## Environments

| Environment | URL |
| ----------- | --- |
| Production Preview | https://main--capstone--namanagrawal57.aem.page/ |
| Production Live | https://main--capstone--namanagrawal57.aem.live/ |
| Feature preview | https://<branch>--capstone--namanagrawal57.aem.page/ |

Content lives in **Document Authoring** (`https://admin.da.live/source/namanagrawal57/capstone`).
Code lives in **GitHub** (`namanagrawal57/capstone`) and is deployed by AEM Code Sync.

## Custom domain + CDN (go-live steps)

The `*.aem.page` / `*.aem.live` hosts always send `X-Robots-Tag: noindex, nofollow`
and serve a default `robots.txt`, so they are intentionally **not** indexable —
this is why a Lighthouse SEO run against them is capped (the "page is blocked
from indexing" audit fails). Full SEO (incl. our `robots.txt` and sitemap) only
takes effect on a real production domain. To go live on `www.example.com`:

1. **Choose a CDN.** EDS supports Adobe-managed CDN, Cloudflare, Akamai,
   Fastly, or CloudFront. For the simplest path use the **Adobe-managed CDN**.
2. **Add the production host to the project config** (`.helix/config` / the
   config service) via the `cdn.prod.host` setting, e.g. `www.wknd.example`.
   Once set, `helix-sitemap.yaml`'s `origin` can be dropped (the sitemap uses
   the prod host automatically).
3. **Point DNS** for `www.example.com` at the CDN, and configure the CDN to
   origin-pull from `main--capstone--namanagrawal57.aem.live`.
   - Adobe-managed: add the domain in the config and set the CNAME to the
     Adobe-provided target; TLS is provisioned automatically.
   - BYO CDN: create a pull zone / distribution with origin
     `main--capstone--namanagrawal57.aem.live`, forward the `Host` header, and
     add the `push-invalidation` integration so publishes purge the CDN.
4. **Verify** on the production domain:
   - `https://www.example.com/robots.txt` returns *our* robots.txt (allows
     crawling, references the sitemap) and the `X-Robots-Tag: noindex` header is
     gone.
   - `https://www.example.com/sitemap.xml` lists the pages with production
     `<loc>` URLs.
   - Re-run Lighthouse: SEO should now reach 100.
5. **Update absolute references** for the production host:
   - `helix-sitemap.yaml` `origin` (or rely on `cdn.prod.host`).
   - `robots.txt` `Sitemap:` line.
   - Any absolute preconnect in `head.html`.

## Indexing behavior (learned)

- The query index (`/query-index.json`) is built **on publish** (live), not on
  preview alone, and is maintained on the **main** branch. After publishing a
  new page that matches `helix-query.yaml`'s `include`, the index rebuilds
  within seconds and the `article-list` block picks it up with no code change.
- `helix-query.yaml` must use `parseTimestamp(headers['last-modified'], …)`
  (bracket syntax). A function-call form silently disables the whole index.

## Document Authoring content format (learned)

When POSTing content to the DA source API, wrap it as a full DA document and
wrap each **block** in a section `<div>`:

```
<body>
  <header></header>
  <main>
    <div>…default content…</div>
    <div><div class="contributor">…</div></div>
    <div><div class="metadata">…</div></div>
  </main>
  <footer></footer>
</body>
```

A block `<div class="name">` placed directly under `<main>` (not inside a
section `<div>`) is treated as a section wrapper and never decorates.

## Publishing workflow

- **Code:** feature branch → PR → CI (`build` lint + `aem-psi-check`
  Lighthouse) → merge to `main` → Code Sync deploys.
  - The PSI check requires a preview URL in the PR description.
- **Content:** edit in DA (each save creates a version = snapshot) → preview
  (review) → publish (live). A labeled version can be created via the DA
  `versionsource` API as an explicit review checkpoint.

## Second locale (/fr) — how rollout scales

The `/fr` home page demonstrates locale support:
- Locale content lives under a path prefix (`/fr/**`) in DA.
- Bulk metadata (`metadata.json`) maps `/fr/**` → `lang: fr` and locale-specific
  `nav: /fr/nav`, `footer: /fr/footer`. `scripts.js` reads the `lang` metadata
  to set `<html lang>`; the header/footer blocks read `nav`/`footer` metadata.

To scale to more locales (e.g. `/de`, `/es`):
1. Add the locale sub-tree in DA (`/de/**`) with translated content + `/de/nav`,
   `/de/footer`.
2. Add one `metadata.json` row: `URL: /de/**`, `lang: de`, `nav: /de/nav`,
   `footer: /de/footer`.
3. Publish. No code change is required — the locale mechanism is data-driven.
For larger programs, use a translation workflow (e.g. GLaaS / a TMS) to generate
the localized documents, and a per-locale query index + sitemap if the locales
should be indexed separately.
