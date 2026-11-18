# Contributing

Thanks for helping maintain an honest proxy directory. The project is a **discovery and linking site**, not a proxy server, scanner, or anonymity service.

## Ground rules

1. **Never fabricate a proxy.** Do not add placeholder hosts, example domains, demo credentials, or invented latency/status values to `data/proxies.json`.
2. **Never publish an unreviewed import.** Candidates from `sources:import` stay in the gitignored review queue until a person checks the endpoint and the source terms.
3. **Test only endpoints that are already approved.** The monitor must not become an unrestricted network scanner.
4. **Do not add a paid dependency, tracking script, or backend** for a feature that can be static.
5. **Availability is not trust.** Do not describe any proxy as anonymous, private, or 100% secure. Keep the distinction between an availability check and a security audit.
6. **Keep public and private credentials separate.** Public MTProto secrets belong in `data/proxies.json` because they are part of the invite link. API tokens, deployment keys, and monitoring credentials must never appear in the repository, client bundle, or logs.

## Adding or changing proxy data

1. Register the source in `data/sources.json` (id, name, URL, kind, license, status). If you cannot state the license or redistribution permission, do not import the list.
2. Add a verified endpoint:

   ```bash
   npm run proxies:add -- \
     --server relay.example.net --port 443 \
     --secret <32-or-more-even-hex-characters> \
     --source <registered-source-id> \
     --name "Short label" --country DE --trust community
   ```

3. Run `npm run validate:proxies`. Fix every error; do not hand-edit around validation.
4. Run `npm run monitor:proxies` if you can reach the endpoint. A proxy that cannot be verified may remain `unknown`; never set `online` manually.
5. Inspect the diff. Remove anything you cannot justify. Commit the data change separately from unrelated code changes.

Status meanings:

| Status | Meaning |
| --- | --- |
| `online` | A successful MTProto-aware probe completed recently |
| `offline` | Repeated probes failed after the configured failure threshold |
| `timeout` | The endpoint did not answer within the timeout |
| `unknown` | Not checked yet, verification unsupported, or below the failure threshold |

## Code changes

- Keep TypeScript strict and run `npm run typecheck`.
- Add or update tests for validation, filtering, formatting, or translation changes: `npm test`.
- Run `npm run build` before opening a pull request. It regenerates route shells and must complete without warnings that indicate broken metadata.
- Follow the existing structure: logic in `src/lib`, data access in `src/services`, copy in `src/i18n`. Do not hardcode user-facing English or Arabic strings in components.
- Every user-facing string must exist in both dictionaries and preserve placeholders. The i18n test enforces parity.
- Use semantic HTML, keep 44px touch targets, and preserve RTL behaviour. Technical strings (hosts, ports, secrets) use the `ltr-data` treatment.
- Respect reduced motion. Do not add autoplaying or looping animation to data views.
- Do not test raw TCP or HTTP pings from the browser and pretend they prove MTProto availability.

## Sources and licensing

- Do not scrape indiscriminately. Respect `robots.txt`, rate limits, and terms of service.
- Record the source URL, license, and import date in `data/sources.json`.
- If a source forbids redistribution, do not import it, even manually. Link to it from documentation instead.
- Remove a source promptly if its owner asks; document the removal in the pull request.

## Reporting problems

- Security vulnerabilities: follow [SECURITY.md](SECURITY.md), not a public issue.
- A proxy that is malicious, mislabelled, or leaks traffic: open an issue with the proxy id and evidence, or use the report link on the detail page. Do not paste secrets into public chat logs beyond what is already published.
- Broken UI or incorrect metadata: include the route, browser, language, theme, and a screenshot if possible.

## Pull requests

Small, focused pull requests are easier to review. State what changed, why, and how you verified it. Data additions should include the source and the verification command you ran. By contributing, you agree that your code is licensed under the repository's MIT license.
