# Automated top-12 collector

The collector discovers free MTProto proxies from explicitly approved public
feeds, validates and deduplicates them, performs a real MTProto handshake
against each candidate, ranks only the verified endpoints, and publishes the
best ten to `data/top-proxies.json`. The website reads that static file; it
never discovers or tests proxies in the browser.

## Commands

```bash
npm run collect:proxies          # fetch, verify, rank, publish
npm run collect:proxies:dry      # same work, prints the ranking, writes nothing
npx tsx scripts/collect-proxies.ts --config config/collector.json
```

The default configuration is `config/collector.json`. A manual run needs
outbound access to the configured allowlist only.

## Configuration

`config/collector.json` is the single place that controls collection. Key
fields:

| Field | Purpose |
| --- | --- |
| `featuredCount` | Number of proxies published on the homepage (default `12`). |
| `maxCandidates` | Upper bound on endpoints verified per run. |
| `verificationAttempts` | Handshake attempts per endpoint per run. |
| `timeoutMs` / `concurrency` | Per-socket timeout and parallelism limits. |
| `maxResponseBytes` | Hard cap on downloaded feed size. |
| `minimumSuccessRate` | Published eligibility threshold (percent). |
| `minimumSuccessfulChecks` | Successful handshakes required in the rolling window. |
| `maximumLatencyMs` | Median latency ceiling for eligibility. |
| `maximumDataAgeMinutes` | How long a verification stays fresh. |
| `failureThreshold` / `exclusionHours` | Consecutive failed runs before exclusion and exclusion duration. |
| `runnerRegion` | Label stored with each verification; `COLLECTOR_RUNNER_REGION` may override it. |
| `allowedHosts` | HTTPS hosts the fetcher may contact. |
| `sources` | Enabled sources and their feed URLs/priorities. |
| `exclusions` | Servers that must never be collected. |

### Sources

Only the feeds listed in `config/collector.json` are fetched. Unavailable
feeds are reported and skipped; the run continues with the rest.

- **iwizard7** — `iwizard7/MTProxy_list`, generated data on the `data` branch
  under `proxies/`: `working.txt`, `stable.txt`, `best.txt`, `endpoints.json`.
  (The repository moved these files out of the branch root; older URLs 404.)
- **0xRadikal** — `0xRadikal/Free-Telegram-Proxy`: `top100.txt`,
  `resilient/tme.txt`.
- **SoliSpirit** — `SoliSpirit/mtproto`: `all_proxies.txt`.

Each source is fetched at most once per run (shared deduplication), and
candidates are sampled across sources so a large feed cannot fill every
verification slot. Review a source's terms and redistribution permission before
adding it. The collector is not a crawler: anything outside `allowedHosts` is
refused.

## Verification

Validation is a genuine MTProto exchange, never DNS, HTTP, or a bare TCP
connect:

1. The endpoint must be an allowlisted HTTPS feed entry whose server is a
   public hostname or IPv4 address. Private, loopback, link-local, reserved,
   documentation, benchmark and IPv6 non-global ranges are rejected.
2. Ports must be 1–65535 and secrets must be valid Telegram secret material.
3. The probe opens a socket to the resolved public address (pinned after DNS
   resolution to avoid rebinding) and performs:
   - **Plain / `dd…` secrets:** the obfuscated2 randomized-intermediate
     handshake with an AES-256-CTR keystream, then an unencrypted
     `req_pq_multi` (`0xbe7e8ef1`).
   - **Fake TLS / `ee…` secrets:** a 517-byte TLS ClientHello whose random
     commits to the secret with HMAC-SHA256 plus the current Unix time, the
     SNI taken from the extended secret when present, validation of the
     ServerHello HMAC, and then the same obfuscated2 exchange wrapped in TLS
     application-data records.
4. The endpoint is **online** only when the response is an unencrypted
   `resPQ` (`0x05162463`) whose nonce matches the request. A matching
   ServerHello HMAC alone is not enough, and a connection close, timeout, HTTP
   response, or arbitrary bytes are never treated as online.
5. Failures are counted; a single failure does not remove a proxy
   immediately. Anything unconfirmed is `unknown` and is not published.

The probe records the method (`mtproto`), latency, attempts, success rate and
runner region. It does not inspect proxy operator identity, encryption
quality, logging behavior, or privacy. Availability is not security.

## Ranking and publication

Only endpoints with fresh, sufficiently successful verification are eligible.
The score combines:

- verification success rate — 40%
- stability / failure history — 15%
- median latency — 20%
- freshness — 10%
- source diversity — 10%
- verification volume — 5%

Latency alone never decides the ranking. The top `featuredCount` records are
assigned ranks `01…N` and written atomically to `data/top-proxies.json`;
`npm run data:sync` copies the validated file to `public/data/`. When fewer
than ten proxies qualify, fewer are published — positions are never padded.
The homepage displays an explicit note in that case.

If a run cannot complete safely (for example, every probe fails), the previous
valid dataset and state are preserved and the run exits with an error. A
previous record that starts failing is rechecked, kept visible according to the
stale policy, and eventually excluded after `failureThreshold` consecutive
failed runs. Excluded endpoints are retried after `exclusionHours` and can
return after a fresh successful verification.

## State file

`data/collector-state.json` stores rolling verification history, failure
streaks, exclusions with expiry, and previously published endpoints that must
be rechecked. It contains public proxy invite credentials (server, port,
secret) by design — the same values published in the dataset — and never
contains API tokens, GitHub credentials, Telegram account data, or private
secrets. Treat it as public data, not as a secret store. Commit it alongside
the dataset so the next run inherits the history.

## GitHub Actions

`.github/workflows/collect.yml`:

- runs every two hours (`15 */2 * * *`) and supports manual dispatch;
- installs with `npm ci`, runs typecheck and tests, then the collector;
- caches `.cache/collector` to reduce upstream requests;
- requests only `contents: write` so it can commit changed data;
- uses a `proxy-collector` concurrency group to prevent overlapping runs;
- commits only `data/top-proxies.json`, `data/collector-state.json`, and
  `public/data/top-proxies.json`, and only when they changed;
- logs proxy ids and `host:port` pairs, never full secrets.

GitHub cron expressions cannot be changed at runtime. Keep the `schedule.note`
in `config/collector.json` in sync with the workflow if you change the
interval.

## Website freshness

The site fetches `/data/top-proxies.json` (or `VITE_TOP_DATA_URL` when set), so
deploying a new file is the only way the featured list changes. The manual
refresh button re-fetches that static file with a 30-second cooldown; it does
not trigger server-side discovery or probing. `updatedAt` is always displayed
so a stale snapshot is not presented as live data.
