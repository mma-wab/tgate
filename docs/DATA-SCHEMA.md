# Data schema

`data/proxies.json` is the single source of truth. It is validated before publication and copied to `public/data/proxies.json` by `npm run data:sync`.

> All example values below are illustrative. Example domains and documentation IP ranges are rejected by validation and are never rendered as working proxies.

## Dataset

```json
{
  "schemaVersion": 1,
  "lastUpdated": "2026-11-17T12:00:00Z",
  "proxies": []
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `schemaVersion` | `1` | Any other value is reported as unsupported. |
| `lastUpdated` | ISO UTC string or `null` | Updated by the monitor when data changes. |
| `proxies` | array | Invalid rows are skipped and reported; valid rows are published. |

## Proxy record

```json
{
  "id": "example-relay-a1b2c3",
  "name": "Example relay",
  "type": "mtproto",
  "server": "relay.example.net",
  "port": 443,
  "secret": "<32–256 even-length hex characters>",
  "country": "DE",
  "sourceId": "manual",
  "trust": "community",
  "status": "unknown",
  "latencyMs": null,
  "lastChecked": null,
  "lastOnline": null,
  "consecutiveFailures": 0,
  "history": [],
  "createdAt": "2026-11-17T12:00:00Z",
  "notes": null
}
```

| Field | Rules |
| --- | --- |
| `id` | 3–64 characters, `A-Z a-z 0-9 _ -`, starts alphanumeric. Public URL segment. |
| `name` | Required, sanitized, up to 60 characters. |
| `type` | Must be `"mtproto"`. SOCKS5/HTTP proxies are out of scope. |
| `server` | Public hostname or IPv4 only. No scheme, path, port, credentials or whitespace. Private, CGNAT, link-local, multicast, documentation and example ranges are rejected. |
| `port` | Integer 1–65535. |
| `secret` | Hex, optional `0x` prefix stripped, 32–256 characters, even length. |
| `country` | ISO 3166-1 alpha-2 or `null`. Only set it when reliably known. |
| `sourceId` | An id present in `data/sources.json`; lowercase slug, 2–40 characters. |
| `trust` | `trusted-source`, `community`, or `unverified`. |
| `status` | `online`, `offline`, `timeout`, or `unknown`. |
| `latencyMs` | Measured latency for an online probe, or `null`. Never invented. |
| `lastChecked` | ISO UTC timestamp of the most recent attempt, or `null`. |
| `lastOnline` | ISO UTC timestamp of the most recent successful MTProto probe, or `null`. |
| `consecutiveFailures` | Non-negative integer used by the failure threshold. |
| `history` | Up to 48 entries: `{ at, status, latencyMs, method? }`. Invalid entries are dropped. |
| `createdAt` | ISO UTC timestamp. Defaults to the Unix epoch when absent. |
| `notes` | Optional sanitized context, up to 280 characters. |

Unknown keys are dropped during normalization, so private review metadata cannot leak into the public dataset.

## Status semantics

| Status | Meaning |
| --- | --- |
| `online` | A nonce-matching `resPQ` was received during the last successful MTProto probe. |
| `offline` | Repeated network failures reached the configured threshold. |
| `timeout` | Repeated timeouts reached the configured threshold. UI filters treat it as offline. |
| `unknown` | Not checked yet, a single failure below the threshold, or an unconfirmed plain/FakeTLS handshake. **Never counted as online.** |

The UI computes “availability verified” from `lastOnline`, not from the current badge. Availability history is evidence of past responsiveness, not a security claim.

## Trust labels

| Label | Meaning |
| --- | --- |
| `trusted-source` | The source has a verifiable identity or established reputation. Still not a security guarantee. |
| `community` | Submitted or imported from the community and manually reviewed for format and duplicates. |
| `unverified` | No meaningful source reputation or security review. |

## Sources

`data/sources.json`:

```json
{
  "schemaVersion": 1,
  "sources": [
    {
      "id": "manual",
      "name": "Manual review",
      "url": null,
      "kind": "manual",
      "license": null,
      "addedAt": "2026-11-17T00:00:00Z",
      "lastSyncAt": null,
      "importedCount": 0,
      "validationStatus": "validated"
    }
  ]
}
```

`kind` is one of `manual`, `official`, `community`, `public-list`. `validationStatus` is one of `validated`, `pending-review`, `disabled`. Document the source's terms, rate limits, and redistribution permission before importing anything.

## Import and approval flow

1. `npm run sources:import -- --file candidates.json --source <id>` validates candidates and writes `data/candidates.json` (gitignored), including rejected rows and reasons.
2. Review each accepted candidate manually: source legitimacy, operator reputation, duplicate risk, and whether sharing the credentials is permitted.
3. Add approved entries with `npm run proxies:add`.
4. Run `npm run validate:proxies` and `npm run monitor:proxies`.
5. Commit only `data/proxies.json` and any review documentation that is safe to publish. Never commit pending credentials.

## Featured top-12 dataset

`data/top-proxies.json` is written only by the collector (see
[docs/COLLECTOR.md](./COLLECTOR.md)) and copied to
`public/data/top-proxies.json` by `npm run data:sync`. The homepage reads the
static copy; it never probes anything itself.

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-11-17T14:33:43.916Z",
  "totalSources": 3,
  "totalDiscovered": 791,
  "totalVerified": 94,
  "featuredCount": 12,
  "maxAgeMinutes": 480,
  "sourceLabels": { "iwizard7": "iwizard7 MTProxy List" },
  "proxies": [
    {
      "id": "proxy-28e1dd80",
      "rank": 1,
      "server": "relay.example.net",
      "port": 8443,
      "secret": "79e344818749bd7ac519130220c25d09",
      "protocol": "MTProto",
      "status": "online",
      "latencyMs": 158,
      "medianLatencyMs": 158,
      "successRate": 100,
      "successfulChecks": 3,
      "failedChecks": 0,
      "verifiedAt": "2026-11-17T14:33:43.916Z",
      "lastFailedAt": null,
      "method": "mtproto",
      "runnerRegion": "github-actions",
      "sourceCount": 3,
      "sources": ["iwizard7", "radikal", "solispirit"],
      "country": null,
      "score": 96.9
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `updatedAt` | Time of the run that produced the snapshot; `null` before the first successful run. |
| `totalSources` / `totalDiscovered` / `totalVerified` | Counts for the run; discovered is pre-dedup, verified is eligible after probing. |
| `featuredCount` | Requested maximum; the actual number of records may be smaller. |
| `maxAgeMinutes` | Freshness limit applied when building this snapshot. |
| `sourceLabels` | Display names keyed by source id. |
| `proxies` | Ranked records. `rank` is contiguous from 1 and never padded. |

Published records always have at least one successful check and a valid
`verifiedAt`; the browser parser rejects anything else. `secret` is a public
invite credential by design. `country` stays `null` unless the source supplied
a reliable value.

## Monitoring contract

The monitor performs a single MTProto-aware probe per endpoint per run:

- Builds a 64-byte obfuscated2 init packet. With a secret, the AES key is `SHA-256(key + secret)` and the 16-byte IV is used directly; without one, both are used as-is.
- For FakeTLS (`ee…`) secrets, sends a TLS ClientHello whose random carries an HMAC-SHA256 of the hello plus a Unix timestamp, validates the ServerHello HMAC, then wraps the obfuscated2 exchange in TLS application-data records. Extended secrets may carry the SNI domain after the 16-byte key; the domain is never used as key material.
- Sends an unencrypted `req_pq_multi` framed for the secure envelope.
- Accepts `online` only when the response decrypts to `resPQ` (`0x05162463`) with the matching nonce.
- Reports `unknown` for malformed responses or unconfirmed handshakes; never guesses `online` from a TCP connect, TLS reply, or HTTP status.
- Applies the failure threshold before changing to `offline`/`timeout`, and resets failures on success.
- Reserves 48 history points and updates `lastUpdated` only when writing.
