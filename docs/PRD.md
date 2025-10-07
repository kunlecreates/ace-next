# ![Acegrocer Logo](https://kunlecreates.org/assets/acegrocer-logo.png)
# Product Requirements Document (PRD)  
**Project:** Acegrocer Next.js Platform  
**Version:** 1.0  
**Date:** October 2025  
**Owner:** Kunle Ogunlana

---

## 1. Problem statement
Acegrocer needs a reliable, secure, and performant online grocery storefront that lets customers discover products, manage a cart, and place orders, while giving admins the tools to manage catalog, inventory, and order fulfillment. The experience must be fast and simple on web, and the platform must ship safely and often via CI/CD to Kubernetes. Developers and operators need observability, and a maintainable architecture for continued growth and scalability. Initial deployments optimize for simplicity (single app, SQLite) with a clear path to scale (Postgres/MySQL, observability, and autoscaling) as adoption grows.

---

## 2. Goals & non-goals

### Goals
- Customer journey: registration/login, product browsing/search, cart management, checkout, order tracking, and purchase history. (FR001, FR004, FR007–FR012)
- Admin capabilities: product and stock management, order/transaction review and updates. (FR003, FR005–FR006, FR012)
- Platform readiness: secure auth (JWT + httpOnly cookies), HTTPS-first posture, metrics/logs/traces, automated CI/CD to Kubernetes via Helm. (FR013–FR016)
- Quality: automated unit/integration/E2E tests with coverage in CI; reliable builds; deterministic deployments.
- Operability: expose minimal metrics endpoint and integrate with cluster OpenTelemetry collectors without requiring app-side ServiceMonitors.
- Security: Provide secure user authentication and authorization with role-based access.

### Non-goals (v1)
- Real payment gateway integration (use a mock payment flow first). (FR009 scope)
- Complex multi-warehouse inventory, returns/refunds workflows, or external ERP/WMS integrations.
- Multi-tenant RBAC beyond customer and admin roles.
- Personalized AI-driven product recommendations (future enhancement).
- Multi-region database replication (single SQLite instance initially).
- Full microservices decomposition; v1 remains a single deployable app with a migration path to split later if needed.

---

## 3. Personas & Use Cases

| **Persona** | **Description** | **Use Cases** |
|----------|--------------|-----------|
| **Customer** | Grocery shopper seeking convenience and transparency. | Create account, log in, browse catalog, add to cart, checkout, track orders, view purchase history. |
| **Admin** | Store manager overseeing operations. | Log in with elevated privileges, manage users, CRUD products, adjust stock, review/manage transactions, monitor orders and update statuses (e.g., pending → shipped → delivered). Review transactions for reconciliation and basic audit. |
| **Developer/DevOps** | Responsible for deployment and stability. | Ship changes safely via CI/CD pipelines to Kubernetes, monitor system health via logs, metrics, and traces; troubleshoot quickly. Ensure uptime, manage secrets, configuration and observability stack for environments (dev/staging/prod). |

---

## 4. Requirements

### Functional requirements (FR)

| **Requirement ID** | **Description** | **User Story** | **Expected Behavior/Outcome** |
| --- | --- | --- | --- |
| **FR001** | User Registration & Login | As a customer, I want to create an account and securely log in so I can shop and manage my orders. | The system should allow new users to sign up and existing users to log in using JWT-based authentication with secure cookies. |
| **FR002** | Profile Management | As a customer, I want to update my personal information (name, email, password) so that my account details stay accurate. | The system should provide a profile page where users can view and update their information. |
| **FR003** | Role-Based Access | As an admin, I want to have elevated privileges so that I can manage users, products, and transactions. | The system should enforce role-based access control, restricting sensitive operations to authorized roles only. |
| **FR004** | Product Catalog Browsing | As a customer, I want to browse available products by category, price, or keyword so that I can find items I need. | The system should provide a searchable and filterable product catalog with pagination. |
| **FR005** | Product CRUD (Admin) | As an admin, I want to add, update, or remove products so that the inventory stays accurate. | The system should provide APIs and/or admin UI for CRUD operations on products and categories. |
| **FR006** | Stock Management | As an admin, I want stock quantities updated in real time so that customers see correct availability. | The system should update stock levels automatically when purchases are made or when admins adjust inventory. |
| **FR007** | Shopping Cart | As a customer, I want to add, update, and remove products in my cart so that I can prepare for checkout. | The system should provide cart management functionality tied to the customer’s account. |
| **FR008** | Checkout Process | As a customer, I want to proceed to checkout so that I can place my order. | The system should validate stock, calculate totals, and confirm the order before processing. |
| **FR009** | Payment Handling (Mock) | As a customer, I want to simulate a payment so that I can complete my purchase (future integration with real gateway planned). | The system should provide a mock payment service and store transaction details securely. |
| **FR010** | Order Tracking | As a customer, I want to track my order status (pending, shipped, delivered) so I know when to expect it. | The system should update and display order status in real time. |
| **FR011** | Transaction History | As a customer, I want to view my past purchases so that I can keep track of what I’ve bought. | The system should display a history of completed transactions tied to the customer’s account. |
| **FR012** | Admin Transaction Management | As an admin, I want to view and manage transactions so that I can ensure smooth order fulfillment. | The system should provide admins with a dashboard or API endpoints for reviewing and updating transactions. |
| **FR013** | Observability & Monitoring | As a developer/ops team, I want metrics, logs, and traces so that I can monitor performance and troubleshoot issues. | The system should emit telemetry compatible with cluster-level OpenTelemetry namespace instrumentation (no ServiceMonitor required), expose a JSON/Prom-like metrics endpoint for ad-hoc scraping, and rely on the platform’s collectors for traces/logs. |
| **FR014** | CI/CD Deployment | As a developer, I want automated builds and deployments so that changes are tested and deployed quickly. | The system should build with Node/npm, package a Docker image, push to GitHub Container Registry (GHCR), and deploy to Kubernetes via Helm using GitHub Actions on a self-hosted runner. Ingress is via NGINX (class "nginx"), fronted by Cloudflared tunnel. |
| **FR015** | Security & Reliability | As a user, I want my data protected so that I can trust the platform. | The system should enforce HTTPS, secure cookie handling, JWT validation, and apply secret management (initially env vars, future HashiCorp Vault). |
| **FR016** | Testing & Quality Assurance | As a developer, I want automated unit and integration tests so that I can ensure code quality and prevent regressions. | The system should have >80% test coverage using Jest (and/or Vitest), Testing Library for UI, and Supertest/Playwright for API/E2E, with coverage via Istanbul/nyc and results integrated into GitHub Actions. |

---

### Non-functional requirements (NFR)

| **Requirement ID** | **Description** | **User Story** | **Expected Behavior/Outcome** |
| --- | --- | --- | --- |
| **NFR001** | Performance | As a customer, I want the app to respond quickly so that my shopping experience is smooth. | The system should handle 1,000+ concurrent users with an average response time of <2 seconds for common operations (e.g., browsing, adding to cart). |
| **NFR002** | Scalability | As a business, I want the system to grow with demand so that it can support more customers. | The microservices should scale independently (horizontally) in Kubernetes, supporting spikes during peak hours without downtime. |
| **NFR003** | Security | As a user, I want my personal and payment information secured so that I can trust the platform. | The system should use JWT authentication, HTTPS/TLS encryption, secure cookie handling, and store secrets securely (initially env vars, later HashiCorp Vault). |
| **NFR004** | Reliability | As a customer, I want the system to be available whenever I need it so that I can shop anytime. | The system should maintain 99.9% uptime, with retry logic, fallback mechanisms, and Kubernetes self-healing (restart failed pods automatically). |
| **NFR005** | Maintainability | As a developer, I want clean modular code so that I can update features without breaking others. | The codebase should follow clean architecture principles, with proper documentation, and microservices separated by clear API boundaries. |
| **NFR006** | Observability | As DevOps, I want logs, metrics, and traces so that I can monitor and troubleshoot the system. | The system should integrate with cluster OpenTelemetry instrumentation for logs/traces; app provides minimal /api/metrics endpoints for runtime counters. |
| **NFR007** | Portability | As a developer, I want the app deployable anywhere so that I’m not locked into one environment. | The system should be fully containerized and deployable on Kubernetes via Helm charts, supporting both dev and production clusters. |
| **NFR008** | Testability | As a developer, I want automated testing so that I can ensure high quality and reduce bugs. | The system should have >80% unit and integration test coverage, with Jest/Vitest coverage (Istanbul) integrated into the GitHub Actions pipeline. |
| **NFR009** | Usability | As a customer, I want an intuitive interface so that I can shop easily without confusion. | The system should provide a simple UI/UX for product browsing, checkout, and account management, with accessibility best practices in mind. |
| **NFR010** | Compliance | As a business, I want compliance with data protection standards so that we avoid legal issues. | The system should comply with GDPR-like principles (data privacy, consent, right-to-forget) and use secure data handling practices. |

---

### Constraints & architecture notes

## 5. Success Metrics

| **Category** | **Metric** | **Target** |
|-----------|---------|--------|
| **Performance** | API response time | P50 latency < 1s and average response time < 2s on common operations under 1,000 concurrent users (NFR001) |
| **Reliability** | App service monthly Uptime | 99.9% (NFR004)|
| **Security** | Auth failures | <0.1% |
| **Security** | Auth Tests | Secure cookie flags and JWT validation enforced; periodic auth tests in CI |
| **Security** | Outstanding vulnerabilities | 0 high/critical vulnerabilities in runtime image and dependencies (NFR003) |
| **Testing** | Code coverage | ≥80% unit + integration test coverage (FR016, NFR008) |
| **Testing** | E2E and API test suites | Pass with no flakes across 3 consecutive runs |
| **User Experience** | Checkout completion rate | ≥85% |
| **CI/CD** | Build + deployment success rate | 100% per push |
| **CI/CD** | Merge to Deploy lead time | Median time < 30 minutes; automated rollout with Helm; change failure rate tracked and trending down |

---

## 6. Milestones / Phasing

| **Phase** | **Deliverables** | **Target Date** |
|------------------------|------------------|-----------------|
| **Phase 0 – Foundations** | App scaffold setup, authentication (JWT + secure cookies), user profiles, product browsing, basic cart, local dev environment, and CI pipeline skeleton. | **Feb 2025** |
| **Phase 1 – Checkout & Orders** | Checkout flow with mock payment, order creation and tracking, transaction history UI. | **Mar 2025** |
| **Phase 2 – Admin & Stock Management Tools** | Admin UI/APIs for product CRUD and stock management; order and transaction review and updates tools. | **Apr 2025** |
| **Phase 3 – Observability & CI/CD** | Observability integration (OpenTelemetry for logs/traces, metrics endpoints), GHCR publishing, Helm-based CD pipeline to staging via ARC or Cloudflare Tunnel. | **May 2025** |
| **Phase 4 – Production Hardening** | Security hardening (headers, TLS enforcement, ingress), load and performance testing to meet NFR targets, 99.9% SLOs, operational runbooks for on-call readiness. | **Jun 2025** |
| **Phase 5 – Scale-Out Readiness** | Database migration plan (SQLite → PostgreSQL/MySQL), horizontal scaling setup, PVC adjustments, rollout and blue/green deployment strategy. | **As Needed (Post-June 2025)** |

---

## 7. Open questions
- Payments: Which gateway will we adopt post-mock (Stripe, Adyen, etc.) and what is the target timeline?
- Data model: Do we require returns/refunds and partial shipments in v1.1, and how will they impact order states?
- Catalog: Are categories and attributes sufficient, or do we need variants/options (e.g., sizes/weights) early on?
- Security: Any regulatory obligations beyond GDPR-like practices (e.g., PCI scope if/when real payments are added)?
- Data Protection: How should GDPR "right-to-forget" be implemented across services?
- Observability: What sampling and retention policies are set in the cluster collectors? Any org-wide logging standards to align with?
- Infrastructure: Confirm Kubernetes namespaces, secret naming conventions, and Helm release naming per environment; finalize Cloudflared/Ingress DNS details.
- Scale: What traffic thresholds trigger the migration from SQLite to Postgres/MySQL? Who owns and executes that migration? 
- User Account Registration: Will notifications (email/SMS) be included in MVP?

---

## Constraints & architecture notes
- **Stack:** Node/Next.js + TypeScript  
- **Frontend:** Tailwind CSS v4 + shadcn components + next-themes + lucide-react + sonner toasts 
- **Deployment:** GitHub Actions builds, tests, and publishes a Docker image to GHCR. CD deploys to Kubernetes via Helm from a self-hosted runner (ARC runner scale set).  
- **Ingress:** NGINX (class: nginx) exposed via Cloudflared Tunnel at `ace-next.kunlecreates.org`  
- **Storage:** SQLite on a PVC (single-replica only). For horizontal scaling, migrate to Postgres/MySQL and disable the PVC. Deployment uses Recreate strategy while PVC is enabled.  
- **Secrets:** Managed by the CD workflow (not created by the chart) and referenced by the release name pattern (<release>-secrets); future integration with HashiCorp Vault

---

<p align="center">
  <sub>© 2025 Kunle Ogunlana — PRD generated by <b>GPT-5</b></sub>
</p>