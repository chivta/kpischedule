# kpischedule

Unofficial schedule site for KPI at https://kpischedule.chivtar.dev . It reads the public API behind
schedule.kpi.ua (`https://api.campus.kpi.ua`, CORS open to any origin) straight from the browser, so
there is no backend.

What it adds over the official site:

- a now panel with the running pair, minutes left and the next pair, ticking every second
- weeks with real calendar dates: a pair with a `dates` list from the API shows only on those dates,
  and "Whole timetable" brings back the pairs not held that week
- hiding subjects you do not take (electives), per schedule, stored on the device
- search over about 2200 groups and 2200 lecturers that also matches Latin lookalikes (`io-51` finds `ІО-51`)
- saved schedules, with the first one opened on entry to the site
- offline fallback: every response is cached in localStorage and shown when the API is unreachable
- Ukrainian and English, light and dark themes

## Layout

- `frontend/` is a Vite + React + TypeScript SPA. `src/api` holds the client and the raw-to-model
  normalization, `src/lib/time.ts` the Kyiv clock and week arithmetic, `src/i18n/translations.ts`
  every user-facing string.
- `k8s/` holds the manifests Flux reconciles into the cluster: namespace, deployment, service and
  Traefik ingress.

## Local development

```
docker compose up
```

Serves on http://localhost:5173 with hot reload. Or `cd frontend && npm install && npm run dev`.

## Tests

From `frontend/`:

- `npm test` runs the vitest unit tests (time arithmetic, normalization, search).
- `npm run e2e` runs the Playwright suite against a dev server on port 5174, with the API mocked from
  fixtures in `e2e/fixtures` and the browser clock frozen. Run `npx playwright install chromium` once.

## Build the production image

```
docker build --target production -t ghcr.io/chivta/kpischedule/frontend:$(git rev-parse HEAD) frontend
```

nginx serves the bundle on port 8080 as a non-root user with a read-only root filesystem.
`GET /health` returns 204 and `GET /metrics` returns nginx stub_status, both excluded from the
access log. Unknown paths fall back to `index.html`, which is served with `Cache-Control: no-cache`.

## Pipelines

CI (`.github/workflows/ci.yaml`) lints, runs the unit tests, typechecks and builds on every push and PR.
CD (`.github/workflows/cd.yaml`) runs only after CI passes on `main`. It builds the image, pushes it to
`ghcr.io/chivta/kpischedule/frontend` tagged with the full commit SHA, and writes that tag into
`k8s/frontend/deployment.yaml` as a `deploy:` commit. A run whose commit is no longer the tip of
`main` fails at its first step, so a stale run never pins an older image.

## Deploy

Flux reconciles `k8s/` from this repo. The wiring lives in
[chivta/homelab](https://github.com/chivta/homelab) under `clusters/main/apps/kpischedule/`, and the
`deploy:` commit is what triggers a rollout. TLS comes from the wildcard `*.chivtar.dev` certificate
that Traefik already holds. The `kpischedule.chivtar.dev` record in Cloudflare points at the cluster.

`k8s/secrets.enc.yaml` holds the `easter-egg` Secret, encrypted with SOPS to the shared app age key
(`.sops.yaml`). Flux decrypts it in the cluster and the pod mounts it at `/usr/share/nginx/egg`, which
nginx serves under `/egg/`. The plaintext source `k8s/secrets.yaml` is gitignored; edit it and run
`sops -e k8s/secrets.yaml > k8s/secrets.enc.yaml`. For local development, put the same file at the
gitignored `frontend/public/egg/jumpscare.png`.
