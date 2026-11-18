# Security policy

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose users or infrastructure.

- Use GitHub's **private vulnerability reporting** for this repository (Security → Report a vulnerability), or
- Contact the maintainer through the address listed on the deployed `/about` page, if one is configured.

Include the affected route or script, reproduction steps, impact, and any suggested fix. You can expect an acknowledgement as soon as practical; this is a volunteer project, so no fixed SLA is promised.

## Scope

In scope:

- The web application and its build/runtime configuration.
- The validation, import, publication and monitoring scripts in `scripts/`.
- The GitHub Actions workflows and their permissions.
- Client-side handling of proxy credentials, submission data and local storage.
- Security headers and deployment configuration in `public/`.

Out of scope:

- The behavior, logging, encryption quality or trustworthiness of third-party proxy operators.
- Telegram clients, Telegram servers, GitHub, Cloudflare, or other third-party services.
- Availability outages that are not caused by a defect in this project.
- Reports that assume the directory is a proxy relay; it is not.

## Security model and known limits

- **No backend and no accounts.** The site is static. There is no login, no password collection, no Telegram account data, and no tracking.
- **Proxy secrets are public by design.** An MTProto secret is part of the invite link. The project never logs secrets in monitoring output, never stores pending submission details in the published dataset, and never exposes unapproved records.
- **Availability is not security.** A successful probe proves that an endpoint answered MTProto at a moment in time. It does not audit the operator, inspect encryption, or guarantee privacy.
- **No fabricated data.** The repository ships with an empty dataset. Example domains and documentation IP ranges are rejected by validation.
- **Monitoring is constrained.** Only published endpoints from reviewed sources are probed, with timeouts, concurrency limits, one probe per endpoint per run, and a failure threshold before reporting an outage. It is not a network scanner.
- **Fake-TLS (`ee…`) secrets are verified, never guessed.** The probe emulates a TLS ClientHello, validates the ServerHello HMAC with the proxy secret, and then performs the same obfuscated2 `req_pq_multi` exchange inside TLS records. If the handshake or nonce does not match, the result stays `unknown`.
- **Submission is manual.** Nothing is published automatically. The browser rate limit, honeypot and duplicate checks reduce spam but are not a substitute for maintainer review.
- **Public configuration only.** `VITE_*` variables are compiled into the client bundle. Never place tokens, private keys or credentials there.

## Hardening checklist for deployers

1. Keep `VITE_REPO_URL` pointed at the public repository only.
2. Review `public/_headers` after any change to data sources; keep the CSP tight and add external hosts deliberately.
3. Enable GitHub branch protection and require review for changes to `data/proxies.json`, workflows and scripts.
4. Keep GitHub Actions permissions minimal (`contents: write` is only needed by the monitor job).
5. Rotate or remove any credential that was ever committed; this project should never need one in the client.
6. Re-run `npm run typecheck`, `npm test`, `npm run validate:proxies` and `npm run build` before deploying.
