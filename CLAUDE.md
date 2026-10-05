# kpischedule

Unofficial KPI schedule SPA at https://kpischedule.chivtar.dev. The browser calls `https://api.campus.kpi.ua` directly (CORS is open to any origin), so there is no backend.

## API facts the code depends on

- Tuesday's day code is `Вв`, not `Вт`. `src/api/normalize.ts` maps codes to day indexes.
- A pair with a non-empty `dates` array is held only on those dates. An empty array means it repeats every other week, in the week array it sits in. `occursOn` in `src/lib/time.ts` is the single implementation of this rule.
- One slot of one day often holds several pairs at once (electives), and `lecturer` and `location` are often null.
- The API gives start times only. A pair lasts 95 minutes (`PAIR_DURATION_MIN`).
- Unknown group or lecturer ids return 200 with empty days, never 404.
- Group ids are numbers in `/group/all` but strings in `groupCode` and `/schedule/status`.
- `/group/all` and `/schedule/lecturer/list` redirect to `cdn.cloud.kpi.ua`.
- Send no custom request headers: the CORS preflight allows only `content-type`.
- The current week number comes from `/time/current`. The app stores it as a week anchor and alternates weeks from there. A Sunday answer never replaces a stored anchor, because whether the server counts Sunday into the ending week is unverified.

## Time

All times are Kyiv wall-clock. Dates are `YYYY-MM-DD` strings and date arithmetic runs in UTC, so daylight saving never shifts a day. The time zone is `Europe/Kiev`, the legacy alias, because older browsers reject `Europe/Kyiv`.

## Frontend conventions

- Styling is inline, built from the tokens in `src/theme.ts`. The only className is `scroll-thin`.
- Every user-facing string lives in `src/i18n/translations.ts`, Ukrainian first, English second. API error codes map to `error.<code>` keys there.
- Shared state is the localStorage-backed stores in `src/lib/storage.ts`. Every response is cached there too, so a schedule opened once still renders offline.

## Tests

- `npm test` runs vitest over `src/` only. The Playwright specs in `e2e/` also match vitest's default pattern, which is why the script passes `--dir src`.
- `npm run e2e` starts its own Vite server on port 5174, mocks both API hosts from `e2e/fixtures`, and freezes the browser clock. The shared fixture fails any test that logs a console error or calls an unmocked API path.
- e2e expectations come from the fixture data and `src/lib/time.ts`. The week of Monday 2026-10-05 is week 2, and Tuesday 2026-10-06 09:10 Kyiv is a running pair for group 5814.
- Run the full suite alone. Two Playwright runs share `test-results/` and break each other's traces.

## The `/egg/` Secret

- The keyboard overlay image lives only in `k8s/secrets.enc.yaml`, a Secret encrypted with SOPS to the shared app age key in `.sops.yaml`. Flux decrypts it in the cluster, the pod mounts it at `/usr/share/nginx/egg`, and nginx serves it under `/egg/`.
- The plaintext `k8s/secrets.yaml` and the local dev copy `frontend/public/egg/jumpscare.png` are gitignored. Never commit either. This machine cannot decrypt `secrets.enc.yaml`.
- After editing `k8s/secrets.yaml`, run `sops -e k8s/secrets.yaml > k8s/secrets.enc.yaml`.
- e2e tests serve a 1x1 PNG for that path, so the suite never needs the real image.
- Commit messages stay neutral about this feature and never name what it does.

## Deploy

- CD runs after CI passes on `main`. It builds the image, pushes `ghcr.io/chivta/kpischedule/frontend:<sha>`, and commits the tag into `k8s/frontend/deployment.yaml` as `deploy: frontend <sha>`. Run `git pull --rebase` before pushing after any CD run.
- A CD run whose commit is no longer the tip of `main` fails at its first step on purpose, so only the newest commit deploys.
- Flux reconciles `k8s/` from this repo. The wiring is `clusters/main/apps/kpischedule/` in `chivta/homelab`.
