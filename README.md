# Acegrocer

A minimal Next.js + TypeScript starter using the App Router.

## Quickstart (Windows PowerShell)

```powershell
# Install dependencies
npm ci

# Start dev server on http://localhost:3000
npm run dev

# Lint & types
npm run lint
npm run type-check

# Build & run production
npm run build
npm run start
```

## Features

- Next.js App Router with TypeScript
- Prisma (SQLite) with seed and make-admin scripts
- JWT auth with httpOnly cookie and RBAC
- Product catalog with admin CRUD
- Cart, checkout (mock payment), and orders (customer + admin)
- Middleware security headers + CSP/HSTS, basic rate limiting (env-configurable)
- Request timing logs and in-memory metrics exposed at /api/metrics
- Dev-only OpenAPI JSON at /api/docs (generated from Zod schemas)
- Tailwind v4 + shadcn-style UI primitives, theme toggle (next-themes), lucide icons, sonner toasts

## Scripts
Common scripts:

```powershell
# Format code
npm.cmd run format

# Lint and type-check
npm.cmd run lint
npm.cmd run type-check

# Unit tests (Vitest)
npm.cmd run test:unit
npm.cmd run test:unit:watch

# E2E tests (Playwright)
npm.cmd run test:e2e
```

## Notes

### API error shape

All API error responses follow a consistent JSON structure:

{
	"error": {
		"message": "<description>",
		"code": "<optional code>",
		"issues": { /* optional Zod error flatten() */ }
	}
}

Validation errors include a Zod issues object for client-side mapping.

### Windows notes

- Use `npm.cmd` in PowerShell to avoid script execution policy issues.
- During DB resets, Prisma on Windows can print a benign warning:
	`EPERM: operation not permitted, unlink ...query_engine-windows.dll.node`. This does not affect tests.
- Playwright E2E config seeds and resets the SQLite DB before each run.

## Testing (Windows PowerShell)

```powershell
# Type-check
npm.cmd run type-check

# Run all Playwright tests (Chromium, 1 worker, no retries)
npm.cmd run test:e2e -- --project=chromium --workers=1 --retries=0

# Run a single spec
npm.cmd run test:e2e -- --project=chromium --workers=1 --retries=0 tests/e2e.fullflow.spec.ts

# Optional: enable rate limiting locally (disabled by default)
$env:RATE_LIMIT_ENABLED = 'true'
npm.cmd run dev

### Dev API docs and metrics

- Swagger UI: http://localhost:3000/api/docs/ui (dev only)
- OpenAPI JSON: GET http://localhost:3000/api/docs (dev only)
- Metrics: GET http://localhost:3000/api/metrics

## Containers (optional)

- Local build

```powershell
docker build -t acegrocer:local .
```

- CI builds and pushes images to GitHub Container Registry (GHCR) on pushes to main as `ghcr.io/kunlecreates/ace-next:latest` and a `:sha` tag.

## Kubernetes deploy (Helm)

- Chart: `charts/acegrocer`
- Staging overrides: `k8s/staging.values.yaml`
- Ingress: NGINX (className: `nginx`), hostname: `ace-next.kunlecreates.org` (exposed via Cloudflared to the ingress controller)
- Persistence (SQLite): PVC with storageClassName `local-storage` (single replica only)
	- When persistence.enabled=true (SQLite), the Deployment uses a Recreate strategy to avoid RWO volume conflicts during upgrades.
	- For horizontal scaling, migrate to Postgres/MySQL and disable the PVC before increasing replicas.
 - Secrets: The chart does not create Secrets by default. The CD workflow applies a Secret named `<release>-secrets` containing `JWT_SECRET` and `DATABASE_URL`. You can override the name via `--set secret.name=...`.
 - Runners: Supports in-cluster Actions Runner Controller (ARC). The CD workflow auto-detects ARC and uses in-cluster auth; see `docs/arc-setup.md` for full setup and RBAC.

Basic commands (from a machine with kubectl and helm configured):

```powershell
helm upgrade --install acegrocer charts/acegrocer `
	-n acegrocer-staging --create-namespace `
	-f k8s/staging.values.yaml `
	--set image.repository=ghcr.io/kunlecreates/ace-next `
	--set image.tag=<sha-or-tag> `
	--set secret.name="acegrocer-secrets"
```

Validation and CD:
- Lint the chart with your overrides:

```powershell
helm lint charts/acegrocer -f k8s/staging.values.yaml `
	--set image.repository=ghcr.io/kunlecreates/ace-next `
	--set image.tag=<sha-or-tag> `
	--set secret.name="acegrocer-secrets"
```

- See `.github/workflows/cd-k8s.yml` for a self-hosted runner workflow that applies the Secret and performs the Helm upgrade (now includes `helm lint`).
	- Uses ARC runner scale sets. Set `runs-on: acegrocer-runnerset` (the Helm release name for the runner scale set).
	- With private GHCR, CD can create a registry pull secret automatically when `GHCR_READ_USERNAME` and `GHCR_READ_TOKEN` repo secrets are set.
	- Workflow supports a prod toggle: set `use_prod: true` and optionally `prod_namespace` to deploy using `k8s/prod.values.yaml`.

See also: `docs/arc-setup.md` for setting up ARC with a GitHub App, RunnerDeployment, and cross-namespace RBAC.

### Test stability notes

- Tests authenticate via API calls (not UI) for speed and stability.
- E2E selects the seeded product “Bananas” to avoid stock race conditions.

## UI verification cheatsheet

- Header shows theme toggle and active link highlighting for the current page.
- Products page renders a card grid with price badges and a Quick Add button; adding updates the Cart badge and shows a toast.
- Product detail page supports explicit quantity add; success/error toasts appear accordingly.
```
