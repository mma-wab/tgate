# Deployment guide

This project is a static site. It builds to `dist/` and needs no server, database, or paid service. The recommended free host is **Cloudflare Pages**; GitHub Actions handles availability monitoring and the automated top-12 collector ([docs/COLLECTOR.md](./COLLECTOR.md)).

- [1. Before you deploy](#1-before-you-deploy)
- [2. Publish the repository to GitHub](#2-publish-the-repository-to-github)
- [3. Create the Cloudflare Pages project](#3-create-the-cloudflare-pages-project)
- [4. Environment variables](#4-environment-variables)
- [5. Custom domain and HTTPS](#5-custom-domain-and-https)
- [6. How data updates reach production](#6-how-data-updates-reach-production)
- [7. Optional: keep data on a separate branch](#7-optional-keep-data-on-a-separate-branch)
- [8. GitHub Actions notes](#8-github-actions-notes)
- [9. Verify the deployment](#9-verify-the-deployment)
- [10. Rollback](#10-rollback)
- [11. Troubleshooting](#11-troubleshooting)

---

## 1. Before you deploy

Requirements: **Node.js 22+**, npm, a GitHub account, and a Cloudflare account (the free plan is sufficient).

Run the full local gate first. Do not deploy if any step fails:

```bash
npm ci
npm run typecheck
npm test
npm run validate:proxies
npm run build
npm run preview
```

The repository intentionally ships with an **empty dataset**. Decide which is true for you:

- **Empty directory** — deploy as-is and invite submissions. The UI has an honest empty state; nothing is fabricated.
- **Curated directory** — add verified entries with `npm run proxies:add` (see the main README) and commit `data/proxies.json`.
- **Automated featured list** — run `npm run collect:proxies` (or let `.github/workflows/collect.yml` run it every two hours) to publish verified proxies to `data/top-proxies.json` and `public/data/top-proxies.json`.

Never commit a proxy you have not verified, and never commit example credentials.

## 2. Publish the repository to GitHub

Create an empty repository on GitHub (no README, no license, no `.gitignore`), then from the project root:

```bash
git init
git add .
git commit -m "feat: initial Telegram Proxy Hub"
git branch -M main
git remote add origin https://github.com/OWNER/REPO.git
git push -u origin main
```

If Git is not configured on your machine yet:

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

The workflows expect the default branch to be `main`. If you use another name, update the branch list in `.github/workflows/ci.yml` and the checkout behaviour of the scheduled monitor (scheduled workflows run from the default branch).

Confirm that `data/proxies.json` and `public/data/proxies.json` contain only approved records, and that no `.env` file was committed (`.gitignore` already excludes it).

## 3. Create the Cloudflare Pages project

1. Sign in to Cloudflare and open **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub and select the repository.
3. Use these build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (leave empty) |
   | Node version | `22` (set `NODE_VERSION=22` if the default differs) |

4. Add the environment variables from section 4 **before** the first production build.
5. Click **Save and Deploy**.

`npm run build` runs the typecheck, syncs `public/data/proxies.json`, builds the SPA, and then generates per-route HTML shells, `sitemap.xml`, `robots.txt` and `404.html`. The generated `dist/` also includes `_headers` and `_redirects`, which Cloudflare applies automatically.

### Alternative: direct upload (no Git integration)

```bash
npm run build
npx wrangler pages deploy dist --project-name telegram-proxy-hub
```

This requires a Cloudflare API login through Wrangler, not a paid API. Git integration is preferred because it rebuilds the site whenever the monitor commits new availability data.

## 4. Environment variables

Set these in **Pages → your project → Settings → Environment variables**. Apply them to both **Production** and **Preview** unless you deliberately want preview builds to differ.

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `VITE_SITE_URL` | Recommended | `https://proxy.example.com` | Canonical origin without a trailing slash. Used by canonical tags, Open Graph URLs, `sitemap.xml`, `robots.txt` and the generated route shells. If omitted, metadata falls back to relative URLs and the default `https://telegram-proxy-hub.pages.dev`. |
| `VITE_REPO_URL` | Recommended | `https://github.com/OWNER/REPO` | Public repository. Enables the footer/About links, detail-page report link, and the prefilled GitHub Issue submission flow. Without it, `/submit` explains that direct submission is not configured and offers to copy the request. |
| `VITE_DATA_URL` | Optional | `https://cdn.jsdelivr.net/gh/OWNER/REPO@data/data/proxies.json` | Remote dataset. If the host differs from your site origin, add it to `connect-src` in `public/_headers`, or the browser will block the fetch. |
| `VITE_TOP_DATA_URL` | Optional | `https://cdn.jsdelivr.net/gh/OWNER/REPO@main/data/top-proxies.json` | Remote featured snapshot produced by the collector. Defaults to the bundled `/data/top-proxies.json`; update `connect-src` for a different host. The file is static — the browser never probes proxies. |
| `VITE_CONTACT_EMAIL` | Optional | `hello@example.com` | Public contact address on the About page. Expect spam; use a dedicated alias. |

All `VITE_` values are embedded in the public JavaScript bundle. Never place API tokens, private keys, or monitoring credentials in them. The monitor scripts read `PROXY_MONITOR_*` variables from the workflow environment only; they are not used by the app.

Changing an environment variable requires a new deployment. Cloudflare does not rebuild automatically for variable changes.

## 5. Custom domain and HTTPS

1. Open **Pages → your project → Custom domains → Set up a custom domain**.
2. Enter the domain (for example `proxy.example.com`).
3. If the domain is already on Cloudflare, the required `CNAME` is created automatically. Otherwise add the shown `CNAME` at your DNS provider.
4. Wait for the certificate to be issued, then set `VITE_SITE_URL` to the final origin and redeploy.
5. Verify that `https://your-domain/` redirects to the canonical host you intend to use. Cloudflare Pages serves both `*.pages.dev` and the custom domain; search engines will treat them as duplicates unless canonical tags point at one origin. `VITE_SITE_URL` drives those tags.

## 6. How data updates reach production

The scheduled workflow `.github/workflows/monitor.yml`:

1. Validates `data/proxies.json`.
2. Probes each published endpoint with the MTProto-aware check.
3. Commits `data/proxies.json` **only if it changed**.
4. Pushing to `main` triggers a Cloudflare Pages build, which republishes `public/data/proxies.json` and the detail-page shells.

Every two hours is about 360 monitor runs per month. The free Pages plan allows 500 builds per month, so normal pull-request previews and manual deploys fit, but a noisy branch can exhaust the budget. To reduce usage, change the cron in `monitor.yml` to every four or six hours.

The monitor probes only endpoints already published from reviewed sources. It does not scan the internet, and it never marks a proxy online without a successful MTProto exchange.

The featured collector workflow `.github/workflows/collect.yml` runs on the same two-hour cadence. It fetches only the feeds in `config/collector.json`, verifies plain and Fake-TLS endpoints, ranks the eligible ones, and commits `data/top-proxies.json`, `data/collector-state.json`, and `public/data/top-proxies.json` only when they change. It requests `contents: write` and uses a dedicated `proxy-collector` concurrency group so runs cannot overlap. If the collector cannot confirm any endpoint, it leaves the previous valid snapshot and state untouched. See [docs/COLLECTOR.md](./COLLECTOR.md) for configuration, exclusions and the stale-data policy.

## 7. Optional: keep data on a separate branch

Use this only if you want availability updates to appear without rebuilding the site on every monitor commit.

1. Create an orphan branch named `data` containing `data/proxies.json`.
2. Change the monitor workflow to commit and push to `data` instead of `main`.
3. Set `VITE_DATA_URL` to a CDN URL for that branch, for example:

   ```
   https://cdn.jsdelivr.net/gh/OWNER/REPO@data/data/proxies.json
   ```

4. Add `https://cdn.jsdelivr.net` to `connect-src` in `public/_headers` and redeploy.
5. Keep the bundled `public/data/proxies.json` as a fallback; the app falls back to it if the remote request fails.

Caveats:

- jsDelivr caches branch content; changes can take up to roughly 12 hours to appear. Pin a tag or release if you need deterministic snapshots.
- The branch and repository must be public for the CDN URL to work, which means the dataset is public — it already is.
- `VITE_DATA_URL` is part of the client bundle. Never point it at a private or authenticated endpoint.
- The app refuses to silently replace an **invalid** remote dataset with an older bundled copy; it surfaces the error instead. A **network** failure does fall back to the bundled file.

## 8. GitHub Actions notes

**CI (`ci.yml`)** runs on pushes to `main` and on pull requests: install, typecheck, unit tests, dataset validation, and a production build. It has read-only repository permissions.

**Monitor (`monitor.yml`)** runs every two hours and on manual dispatch. It requires `contents: write` to push the availability commit; this is declared in the workflow. No personal access token is needed.

- If the push step fails with a protected-branch error, allow the GitHub Actions bot to push to `main` or relax the rule. As an alternative, open a pull request from the workflow instead of pushing directly.
- Scheduled workflows run from the default branch; pushing monitoring code to another branch will not change the schedule.
- If the repository is a fork, scheduled workflows are disabled until you enable them in the **Actions** tab.
- Keep the workflow timeout and concurrency settings. The monitor probes sequentially within a small concurrency limit and does not retry aggressively.
- Do not add repository secrets for proxy checking. The monitor needs none, and public proxy credentials must never be mixed with deployment credentials.

## 9. Verify the deployment

After the first successful build:

- Open `/` and confirm the language and theme switchers persist across reloads.
- Open `/proxies`; with an empty dataset you should see the honest empty state. With data, confirm cards, filters and sorting.
- Open one proxy detail URL directly (not by client-side navigation) to confirm the generated shell exists, for example `/proxies/relay-abc123`.
- Check `/sitemap.xml` and `/robots.txt`; both should reference your real origin and the sitemap must not list `/submit`.
- Check that an unknown path returns the styled 404 page with `noindex`.
- Open the browser console and confirm there are no CSP violations, especially if `VITE_DATA_URL` is remote.
- Inspect response headers for `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and frame denial.
- Verify a Telegram deep link from a detail page matches `https://t.me/proxy?server=…&port=…&secret=…` exactly.
- On a phone, confirm no horizontal scrolling, readable technical strings in RTL, and 44px tap targets.

Useful header check:

```bash
curl -sI https://your-domain/ | grep -iE 'content-security|x-content|referrer|permissions|frame'
```

## 10. Rollback

Cloudflare Pages keeps deployment history. Open **Pages → your project → Deployments**, select a previous successful build, and choose **Rollback**. For data-only regressions, revert the offending commit in `data/proxies.json`; the next build republishes the corrected dataset.

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| A detail URL returns 404 on direct load | The SEO step did not run, so no route shell was generated | Ensure the build command is exactly `npm run build`, not `vite build`. |
| `npm run build` fails on `tsc` | Type error or Node version mismatch | Use Node 22+ and run `npm run typecheck` locally. |
| Data loads locally but not in production | CSP `connect-src` blocks a remote `VITE_DATA_URL` | Add the host to `public/_headers` and redeploy. |
| Submission says direct submission is unavailable | `VITE_REPO_URL` is empty or malformed | Set the public repository URL and redeploy. |
| Monitor never commits | Branch protection, disabled workflows on a fork, or no data changes | Check the Actions log; the workflow exits successfully when nothing changed. |
| `public/data/proxies.json` is stale | `data:sync` was not run | Use `npm run build` (it syncs) or run `npm run data:sync` before committing. |
| Sitemap contains `*.pages.dev` | `VITE_SITE_URL` was not set at build time | Set it, then trigger a new production deployment. |
| Fonts render with a flash or fallback | Self-hosted font files were excluded from the build | Keep `@fontsource*` dependencies and rebuild. |
| Empty directory shows zero online | Expected: there is no data | Add verified entries; the UI never invents availability. |

## Free-tier reality check

Cloudflare Pages free hosting, GitHub public repositories, and GitHub Actions for public repositories are free within their published limits. There is no paid API, database, or proxy relay in this project. Review current provider limits before relying on them for high traffic; the site is static and can be mirrored elsewhere if needed.
