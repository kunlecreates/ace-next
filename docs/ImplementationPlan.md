# Implementation Plan (Acegrocer)

This plan maps PRD requirements to concrete deliverables in this repository (Next.js + TypeScript app). We will use Node/Next.js throughout with GitHub Actions for CI/CD and GHCR for container images.

## Tracks
- Single repo app: Next.js App Router, TypeScript, Node APIs (App Router routes), Prisma/SQLite (local dev), JWT auth (HTTP-only cookies), RBAC, product/catalog UI, cart, checkout (mock payment), orders, basic observability placeholders.

## Phasing
- Phase 0: Scaffolding — DONE
  - Next.js App Router (TS), lint/format, CI build, basic health route — DONE
  - Prisma + SQLite, seed + make-admin scripts — DONE
- Phase 1: Auth + RBAC + Product Catalog — DONE
  - FR001 Auth (register/login/logout via JWT cookie) — DONE
  - FR002 Profile (/api/me GET/PATCH) — DONE
  - FR003 RBAC (admin-only product endpoints guarded) — DONE
  - FR004 Product list/search (server routes + UI) — DONE
  - FR005 Product CRUD (admin pages + routes) — DONE
- Phase 2: Cart + Checkout + Orders — DONE
  - FR006 Cart badge and session header feedback — DONE
  - FR007 Cart CRUD (GET/POST/PATCH/DELETE) with auth — DONE
  - FR008 Checkout flow (server-side validation + order creation) — DONE
  - FR009 Payment (mock) and redirect back to cart success banner — DONE
  - FR010 Customer orders API/page — DONE
  - FR011 Order detail — DONE
  - FR012 Admin orders management — DONE
- Phase 3: Observability, Security hardening, CI/CD — IN PROGRESS
  - FR013 Logging/metrics (basic) — DONE; per-route labeling + Prom endpoint — DONE; Tracing — TODO
  - FR014 Security hardening (rate-limit, headers, CSRF posture) — DONE (CSRF posture documented/TODO if non-JSON forms introduced)
  - FR015 CI enhancements — DONE (Playwright in CI, npm audit, OSV scan, Dockerfile + GHCR publish); Deploy — IN PROGRESS (Helm chart + CD workflow added; `helm lint` runs in pipeline)
  - FR016 NFRs (perf, reliability, maintainability) — ONGOING

## Data Model (Prisma/SQLite for dev)
- User: id, email (unique), name, passwordHash, role (enum: CUSTOMER | ADMIN), createdAt
- Product: id, name, description, priceCents, sku, category, stock, createdAt, updatedAt
- Order: id, userId, status (PENDING | PAID | SHIPPED | DELIVERED | CANCELED), totalCents, createdAt
- OrderItem: id, orderId, productId, qty, priceCents
- Transaction (mock): id, orderId, amountCents, status (AUTHORIZED | FAILED), provider=MOCK, createdAt
- CartItem: id, userId, productId, qty (server-side cart tied to user)

## API surface (current)
- Auth
  - POST /api/auth/register – FR001
  - POST /api/auth/login – FR001
  - POST /api/auth/logout – FR001
- Profile
  - GET /api/me – FR002
  - PATCH /api/me – FR002
- Products
  - GET /api/products?search=&category=&minPrice=&maxPrice= – FR004
  - POST /api/products (admin) – FR005
  - GET/PATCH/DELETE /api/products/[id] (admin) – FR005
- Cart
  - GET/POST/PATCH/DELETE /api/cart – FR007
  - GET /api/cart/count – cart badge
- Checkout
  - POST /api/checkout – FR008, FR009
- Orders
  - GET /api/orders – FR010, FR011 — DONE
  - GET /api/orders/[id] – FR011 — DONE
  - GET/PATCH /api/admin/orders – FR012 (admin) — DONE
 - Health/Docs/Metrics
   - GET /api/health — healthcheck
   - GET /api/docs — OpenAPI 3.1 JSON (dev-only)
   - GET /api/docs/ui — Swagger UI (dev-only)
   - GET /api/metrics — in-memory request counters and timing stats (per-route)
   - GET /api/metrics/prom — Prometheus exposition format

## Security
- JWT in httpOnly cookies; SameSite=Lax, Secure (env-controlled); 12h expiry — DONE
- RBAC: Admin-only endpoints guarded — DONE
- Input validation: BROADLY DONE with Zod on auth, products, cart, admin orders, me; standardized error shape — DONE (continue expanding coverage as needed)
- Caching: Key routes marked no-store; App layout is dynamic to reflect auth state — DONE
- Security headers: CSP/HSTS and other headers via middleware — DONE
- Rate limiting: In-memory, env-configurable with per-endpoint overrides — DONE
- Dependency hygiene: Next upgraded to 15.5.4; audit clean at last run — DONE

## Observability
- Basic request timing + per-request logging with IDs — DONE (middleware)
- In-memory metrics counters and duration stats exposed at /api/metrics — DONE
- Per-route metrics labeling + Prometheus endpoint (/api/metrics/prom) — DONE
- Histograms/pXX and tracing (OpenTelemetry) — TODO

## CI/CD
- GitHub Actions: install, lint, type-check, build, Playwright E2E — DONE
- npm audit and OSV scan (non-blocking) — DONE
- Dockerfile + build/push to GHCR — DONE
- GitHub Deployment record (for releases) — DONE
- Kubernetes deployment via Helm using Project Runners — PARTIAL
  - Helm chart under `charts/acegrocer` (Deployment/Service/Ingress/PVC/ServiceAccount; HPA optional and disabled for SQLite)
  - Secret handling: Chart defaults to external Secret (no Secret created). CD applies a Secret named `<release>-secrets`; chart references it via `secret.name`.
  - SQLite safety: Deployment uses Recreate strategy when `persistence.enabled=true` (RWO PVC) to avoid upgrade conflicts; single replica only.
  - Environments: `k8s/staging.values.yaml`, `k8s/prod.values.yaml` (present)
  - Pipeline: build & push image (GHCR), then `helm lint` and `helm upgrade --install` on a self-hosted runner, with image repo/tag and `secret.name` overrides.
  - Ingress: NGINX className=nginx, hostname ace-next.kunlecreates.org (Cloudflared tunnel in front)
  - Observability: rely on namespace OpenTelemetry instrumentation; no ServiceMonitor required
  - Database migrations: when switching to Postgres/MySQL, add a Helm hook Job to run `npx prisma migrate deploy`

## Acceptance criteria (Phase 1)
- Register/login/logout works; secure cookie set; role stored — DONE
- Admin can CRUD products; customers can search/list — DONE
- Lint/type-check/build pass; minimal e2e smoke — DONE

## Acceptance criteria (Phase 2)
- Cart visible only to authenticated users — DONE
- Add to cart from product page; badge updates immediately — DONE
- Cart page allows in-place quantity update with explicit Update button and cooldown — DONE
- Checkout validates stock, creates order, clears cart, redirects back with success banner — DONE
- Customer can view order history and details — DONE
- Admin can view/manage orders — DONE

## Tests status
- E2E: full customer checkout then admin updates order to SHIPPED (Playwright) — PASS
- Smoke: basic app health/landing — PASS
- API validations: products/cart payloads, login/register negative cases, admin orders PATCH (positive/negative) — PASS
- Stability: tests authenticate via API to avoid UI flakiness; deterministic seeded product selected (Bananas)
- Global setup resets and seeds DB before tests; Playwright auto-builds and starts Next server; CI runs Chromium tests.

## Windows dev notes
- Prisma on Windows can emit EPERM unlink warnings during `prisma db push` due to query engine DLL locks. We skip regenerate during test reset to avoid this and proceed, as seed + tests still pass.

## Notes on recent implementation
- Upgraded to Next.js 15.5.4; adjusted for async cookies()/headers() where applicable.
- Standardized API error shape with helpers; broad Zod validation across routes.
- Middleware adds security headers, CSP/HSTS, request IDs, timing logs, and metrics recording.
- Dev-only OpenAPI 3.1 JSON at /api/docs using zod-to-openapi; Swagger UI at /api/docs/ui; shared schemas in lib/schemas.ts.
- Cart API supports increment (POST) and absolute set/remove (PATCH/DELETE). Count endpoint powers header badge.
- Admin orders API hardened with proper 403/404 and Zod validation; server action updates status in UI.
- Metrics enriched with per-route labels; Prometheus exposition at /api/metrics/prom.
- Deterministic tests: seeded data (Bananas) and API-based auth to stabilize E2E.

## Next phase: actionable TODOs
1) Dev API docs
  - Swagger UI at /api/docs/ui — DONE
  - Expand OpenAPI coverage to 100% (ensure all response/error shapes documented; include examples). Consider generating a Postman collection from OpenAPI.
2) DB indexes & data hygiene
  - SQLite: using a standard UNIQUE index on User.emailLower — DONE (seed backfills).
  - If migrating to Postgres later, consider partial unique indexes appropriately; document migration path.
3) CI/CD & security posture
  - Kubernetes + Helm deploy: finalize GHCR image repository path (set in values or via `--set image.repository=...`). Ensure GitHub secrets exist: `KUBECONFIG_DATA_BASE64`, `JWT_SECRET`.
  - Add optional prod deployment path (job or workflow input) to use `k8s/prod.values.yaml` and prod namespace.
  - Migrations: add Helm hook Job to run `npx prisma migrate deploy` on each release; optional separate seeded admin Job gated by env.
  - Enable Dependabot/Renovate for dependency hygiene; keep npm audit/OSV as non-blocking info gates.
  - Revisit cookie SameSite=Strict in prod (verify flows); document CSRF posture (only JSON APIs now; add double-submit if forms introduced).
4) Observability
  - Add histogram buckets (p50/p90/p99) to metrics; expose in /api/metrics and /api/metrics/prom; add a minimal Grafana dashboard JSON.
  - Add OpenTelemetry tracing: inbound request spans + Prisma/DB spans; optional exporter to OTLP/console.
5) Tests
  - Contract tests: validate API responses against the OpenAPI schema.
  - Add pagination/filters coverage where missing; keep API-based login in E2E for stability; shard E2E in CI and archive traces on failure.
6) UX/Polish
  - Toasts/disabled states on cart updates; better admin tables; empty/zero states; basic a11y sweep.
7) Performance/readiness
  - Add a small load test harness (k6/Artillery) and an optional CI smoke load.
