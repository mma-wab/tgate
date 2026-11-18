# Telegram Proxy Hub

An independent, bilingual (Arabic / English) directory for discovering, checking, and connecting to **Telegram MTProto proxies**. It is a link directory, not a proxy server: it does not relay traffic, does not require an account, and does not collect Telegram credentials.

> This project is not affiliated with or endorsed by Telegram. Availability checks are not security audits, and no proxy is described as completely anonymous or 100% safe.

[العربية](./README.ar.md) · [Contributing](./CONTRIBUTING.md) · [Security policy](./SECURITY.md) · [Data schema](./docs/DATA-SCHEMA.md) · [Collector](./docs/COLLECTOR.md) · [Deployment](./docs/DEPLOYMENT.md)

---

## What is included

- **Production UI** — React 19 + TypeScript + Vite + Tailwind CSS v4, Lucide icons, Framer Motion, self-hosted fonts.
- **Bilingual experience** — full Arabic RTL and English LTR dictionaries, persisted language choice, correct bidi handling for hosts, ports and secrets.
- **Light and dark themes** — persisted, applied before first paint to avoid flashing.
- **Proxy directory** — instant search, status/country/trust filters, latency/recent/name sorting, URL-synced filter state, empty/error/loading states.
- **Proxy details** — availability history chart, recent checks, deep link, copy actions, masked secret reveal, trust and monitoring explanations.
- **Honest data model** — strict JSON schema, deduplication, public-endpoint validation, availability separate from trust, no fabricated entries.
- **MTProto-aware monitoring** — GitHub Actions workflow runs an obfuscated2 handshake plus `req_pq_multi` / `resPQ` probe, records latency and history, and reports `unknown` when verification is not possible.
- **Automated top-10 list** — a scheduled collector fetches approved public sources, verifies plain and Fake-TLS (`ee…`) secrets with a real MTProto exchange, ranks only verified endpoints, publishes `data/top-proxies.json`, and never pads missing positions. See [docs/COLLECTOR.md](./docs/COLLECTOR.md).
- **Source management** — documented sources, import candidates into a gitignored review queue, manual approval before publication.
- **Submission flow** — local validation, duplicate detection, honeypot, client-side rate limit, consent, and a prefilled GitHub Issue. Nothing is auto-published.
- **SEO and hosting** — build-time route shells, canonical/Open Graph/Twitter metadata, JSON-LD, sitemap, robots, security headers, Cloudflare Pages configuration.
- **Accessibility** — skip link, landmarks, keyboard-friendly controls, focus styles, ARIA tabs/accordions/live regions, 44px touch targets, reduced-motion support.

## Quick start

Requirements: **Node.js 22+** and npm.

```bash
npm install
npm run dev          # syncs public data, then starts Vite on http://localhost:5173
npm run build        # typecheck + data sync + production build + SEO pass
npm run preview      # serve ./dist locally
```

The repository ships with an **empty dataset**. That is intentional: no proxy is invented to make the UI look busy. Add verified entries before deploying, or deploy the empty directory and invite submissions.

## Project structure

```
config/
  collector.json          Approved feeds, limits, ranking thresholds
data/
  proxies.json            Public dataset (single source of truth)
  sources.json            Approved source registry
  top-proxies.json        Verified top-10 snapshot written by the collector
  collector-state.json    Rolling verification history and exclusions
public/
  data/proxies.json       Generated copy served by the site
  data/top-proxies.json   Generated featured snapshot served by the site
  _headers                Cloudflare Pages security headers
  _redirects              Cloudflare Pages redirects
  favicon.svg, icons/     Brand assets
  og-image.png            1200×630 social card
scripts/
  sync-public-data.ts     Validates data/ and publishes public/data/
  validate-proxies.ts     CI validation gate
  collect-proxies.ts      Automated source collector and verifier
  monitor-proxies.ts      MTProto-aware availability monitor
  add-proxy.ts            Adds one reviewed proxy
  import-proxies.ts       Queues candidates for manual review
  generate-seo.ts         Route shells, sitemap, robots, 404
  generate-assets.ts      Deterministic PNG brand assets
src/
  components/             UI, layout, proxy cards, legal renderer
  contexts/               Theme, language, toasts, dataset
  hooks/                  Metadata, clock, copy, scroll
  i18n/                   Dictionaries and long-form content
  lib/                    Validation, filtering, formatting
  pages/                  All routes
  services/               Data loading
.github/workflows/        CI and scheduled monitoring
tests/                    Validation, filtering, formatting, i18n parity
```

## Data: add a proxy the safe way

1. Register the source in `data/sources.json`. Do not add a source you have not reviewed for terms and redistribution rights.
2. Add one verified endpoint:

```bash
npm run proxies:add -- \
  --server relay.example.net --port 443 \
  --secret <32-or-more-even-hex-characters> \
  --source manual --name "Example relay" --country DE --trust community
```

3. Validate and check it:

```bash
npm run validate:proxies
npm run monitor:proxies
```

4. Review the diff to `data/proxies.json`, commit, and deploy. The site build republishes `public/data/proxies.json` automatically.

Records are normalized: unknown keys are dropped, servers must be public hostnames/IPv4, ports must be 1–65535, secrets must be 32–256 even-length hex characters, and duplicates (case-insensitive `server|port|secret`) are skipped. See [docs/DATA-SCHEMA.md](./docs/DATA-SCHEMA.md).

> The connector fields in documentation and forms are illustrative. Example domains are rejected by validation and never rendered as working proxies.

## Monitoring

`.github/workflows/monitor.yml` runs every two hours and can be triggered manually. This interval is a deliberate compromise for free GitHub Actions usage; change the cron expression if you accept the cost. The workflow:

1. Validates the dataset.
2. Probes each published endpoint once with an MTProto-aware handshake (obfuscated2 + `req_pq_multi`, expecting a nonce-matching `resPQ`).
3. Records `online`, `offline`, `timeout`, or `unknown`, latency, last success and up to 48 history points.
4. Commits only when `data/proxies.json` actually changed.

Runtime settings:

| Variable | Default | Range | Purpose |
| --- | --- | --- | --- |
| `PROXY_MONITOR_TIMEOUT_MS` | `8000` | 1500–30000 | Per-endpoint network timeout |
| `PROXY_MONITOR_CONCURRENCY` | `4` | 1–10 | Parallel probes |
| `PROXY_MONITOR_FAILURE_THRESHOLD` | `2` | 1–10 | Consecutive failures before `offline`/`timeout` |

Limitations, stated plainly:

- Fake-TLS secrets (`ee…`) are verified with a TLS ClientHello, a ServerHello HMAC check, and the same obfuscated2 exchange; unconfirmed handshakes stay **unknown**, never online.
- A failed probe becomes `unknown` until the failure threshold is reached. The monitor never guesses `online`.
- The probe is a liveness check, not a security audit, encryption review, or operator background check.
- Only endpoints already published from reviewed sources are probed. The script is not a network scanner.

## Automated featured list

`npm run collect:proxies` fetches the allowlisted feeds in `config/collector.json`, validates and deduplicates endpoints, verifies each one with a real MTProto handshake (including Fake-TLS `ee…` secrets), ranks only the verified endpoints, and atomically publishes the best ten to `data/top-proxies.json`. Use `npm run collect:proxies:dry` to inspect the ranking without writing files. `.github/workflows/collect.yml` runs the same command every two hours and commits only changed data files. The site reads the resulting static JSON; it never scans or probes proxies in the browser. Configuration, state, failure behavior and ranking weights are documented in [docs/COLLECTOR.md](./docs/COLLECTOR.md).

## Sources and imports

```bash
npm run sources:import -- --file candidates.json --source community-list
```

Candidates are validated and written to `data/candidates.json` (gitignored) with rejected rows and reasons. Nothing is served publicly. Review each entry manually, then add approved records with `proxies:add`. Never import a list wholesale without confirming its license, rate limits, and permission to redistribute.

## Submissions

The `/submit` form validates locally, detects duplicates against the published dataset and the browser's pending queue, applies a 10-minute client-side rate limit, and uses a hidden honeypot. With `VITE_REPO_URL` configured it opens a prefilled GitHub Issue using the structured template; otherwise it clearly tells the visitor that direct submission is unavailable and offers to copy the request details.

Pending submissions never appear in the directory, and their connection details are never exposed by the site.

## Environment variables

All `VITE_` values are public and end up in the client bundle. Never put tokens, private keys, or monitoring credentials there.

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_SITE_URL` | Recommended | Canonical origin, no trailing slash. Used by metadata, sitemap and robots. |
| `VITE_REPO_URL` | Recommended | Public GitHub repository URL. Enables submission Issues and repo links. |
| `VITE_DATA_URL` | Optional | Remote `proxies.json` URL. If external, add its host to `connect-src` in `public/_headers`. |
| `VITE_CONTACT_EMAIL` | Optional | Public contact address on the About page. |

See `.env.example`.

## Testing

```bash
npm run typecheck
npm test
npm run validate:proxies
npm run build
```

The unit suite covers endpoint/secret/port validation, IPv4 reserved ranges, deduplication, dataset parsing, filtering, sorting, statistics, formatting, and Arabic/English dictionary parity (keys, empty values, placeholders).

## Deploy to Cloudflare Pages (free)

1. Push the project to a GitHub repository.
2. In Cloudflare Pages, create a project connected to that repository.
3. Build command: `npm run build`. Output directory: `dist`.
4. Set `VITE_SITE_URL`, `VITE_REPO_URL`, and optionally `VITE_DATA_URL` / `VITE_CONTACT_EMAIL` in the Pages environment.
5. Deploy. Cloudflare serves the prerendered route shells, `_headers`, `_redirects`, sitemap, robots and generated detail pages.

Full instructions, custom domains, and the data-branch option are in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Security and privacy

- The site stores only a language and theme preference locally. See `/privacy`.
- MTProto proxy secrets are **public by design** — they are part of the invite link. They are still kept out of logs and monitoring output.
- No Telegram account information, passwords, login codes, or tracking pixels are collected.
- Availability is not trust; read `/security` before connecting.
- To report a vulnerability, follow [SECURITY.md](./SECURITY.md).

## License and Copyright

© 2026 Mohammed Majid. All rights reserved.  
Released under the [MIT License](./LICENSE).
