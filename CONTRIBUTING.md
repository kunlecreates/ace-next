# Contributing

Thanks for your interest in contributing to Acegrocer!

- Use Node.js 20+ and npm 10+
- Run `npm ci` after checkout
- Scripts:
  - `npm run dev` – start dev server
  - `npm run lint` – run ESLint
  - `npm run type-check` – run TypeScript in noEmit mode
  - `npm run build` – production build
  - `npm run start` – start production server
- Use Prettier for formatting: `npm run format`
- Use conventional commits if possible

## Windows notes

- In PowerShell, prefer `npm.cmd` to avoid execution policy blocking `npm.ps1`.
- Use VS Code Tasks (Terminal > Run Task…) which are configured to invoke `npm.cmd` on Windows for:
  - Unit tests (Vitest)
  - E2E tests (Playwright)
  - Lint, type-check, build, start, and DB seed
- If you see an error like "Vitest cannot be imported in a CommonJS module using require()":
  - Ensure tests are executed via Vitest (e.g., `npm.cmd run test:unit`) and not directly required from a CJS context.
  - The project uses an ESM Vitest config (`vitest.config.mjs`). Avoid introducing a duplicate `vitest.config.ts`.

## Deployment notes (Helm/Kubernetes)

- Helm chart lives in `charts/acegrocer`; environment overrides in `k8s/*.values.yaml`.
- When `persistence.enabled=true` (SQLite via PVC), the Deployment uses `Recreate` strategy for safe upgrades.
- Secrets are applied by the CD workflow (not created by the chart by default). Default name is `<release>-secrets`; override via `--set secret.name=...`.
- The CD workflow lints the chart (`helm lint`) before running `helm upgrade --install`.
