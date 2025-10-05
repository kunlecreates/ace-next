# Product Requirements Document (PRD)

Below is the current set of requirements we’ll iterate against.

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
| --- | --- | --- | --- |
| FR001 | User Registration & Login | As a customer, I want to create an account and securely log in so I can shop and manage my orders. | The system should allow new users to sign up and existing users to log in using JWT-based authentication with secure cookies. |
| FR002 | Profile Management | As a customer, I want to update my personal information (name, email, password) so that my account details stay accurate. | The system should provide a profile page where users can view and update their information. |
| FR003 | Role-Based Access | As an admin, I want to have elevated privileges so that I can manage users, products, and transactions. | The system should enforce role-based access control, restricting sensitive operations to authorized roles only. |
| FR004 | Product Catalog Browsing | As a customer, I want to browse available products by category, price, or keyword so that I can find items I need. | The system should provide a searchable and filterable product catalog. |
| FR005 | Product CRUD (Admin) | As an admin, I want to add, update, or remove products so that the inventory stays accurate. | The system should provide APIs and/or admin UI for CRUD operations on products and categories. |
| FR006 | Stock Management | As an admin, I want stock quantities updated in real time so that customers see correct availability. | The system should update stock levels automatically when purchases are made or when admins adjust inventory. |
| FR007 | Shopping Cart | As a customer, I want to add, update, and remove products in my cart so that I can prepare for checkout. | The system should provide cart management functionality tied to the customer’s account. |
| FR008 | Checkout Process | As a customer, I want to proceed to checkout so that I can place my order. | The system should validate stock, calculate totals, and confirm the order before processing. |
| FR009 | Payment Handling (Mock) | As a customer, I want to simulate a payment so that I can complete my purchase (future integration with real gateway planned). | The system should provide a mock payment service and store transaction details securely. |
| FR010 | Order Tracking | As a customer, I want to track my order status (pending, shipped, delivered) so I know when to expect it. | The system should update and display order status in real time. |
| FR011 | Transaction History | As a customer, I want to view my past purchases so that I can keep track of what I’ve bought. | The system should display a history of completed transactions tied to the customer’s account. |
| FR012 | Admin Transaction Management | As an admin, I want to view and manage transactions so that I can ensure smooth order fulfillment. | The system should provide admins with a dashboard or API endpoints for reviewing and updating transactions. |
| FR013 | Observability & Monitoring | As a developer/ops team, I want metrics, logs, and traces so that I can monitor performance and troubleshoot issues. | The system should emit telemetry compatible with cluster-level OpenTelemetry namespace instrumentation (no ServiceMonitor required), expose a JSON/Prom-like metrics endpoint for ad-hoc scraping, and rely on the platform’s collectors for traces/logs. |
| FR014 | CI/CD Deployment | As a developer, I want automated builds and deployments so that changes are tested and deployed quickly. | The system should build with Node/npm, package a Docker image, push to GitHub Container Registry (GHCR), and deploy to Kubernetes via Helm using GitHub Actions on a self-hosted runner. Ingress is via NGINX (class "nginx"), fronted by Cloudflared tunnel. |
| FR015 | Security & Reliability | As a user, I want my data protected so that I can trust the platform. | The system should enforce HTTPS, secure cookie handling, JWT validation, and apply secret management (initially env vars, future HashiCorp Vault). |
| FR016 | Testing & Quality Assurance | As a developer, I want automated unit and integration tests so that I can ensure code quality and prevent regressions. | The system should have >80% test coverage using Jest (and/or Vitest), Testing Library for UI, and Supertest/Playwright for API/E2E, with coverage via Istanbul/nyc and results integrated into GitHub Actions. |
| NFR001 | Performance | As a customer, I want the app to respond quickly so that my shopping experience is smooth. | The system should handle 1,000+ concurrent users with an average response time of <2 seconds for common operations (e.g., browsing, adding to cart). |
| NFR002 | Scalability | As a business, I want the system to grow with demand so that it can support more customers. | The microservices should scale independently (horizontally) in Kubernetes, supporting spikes during peak hours without downtime. |
| NFR003 | Security | As a user, I want my personal and payment information secured so that I can trust the platform. | The system should use JWT authentication, HTTPS/TLS encryption, secure cookie handling, and store secrets securely (initially env vars, later HashiCorp Vault). |
| NFR004 | Reliability | As a customer, I want the system to be available whenever I need it so that I can shop anytime. | The system should maintain 99.9% uptime, with retry logic, fallback mechanisms, and Kubernetes self-healing (restart failed pods automatically). |
| NFR005 | Maintainability | As a developer, I want clean modular code so that I can update features without breaking others. | The codebase should follow clean architecture principles, with proper documentation, and microservices separated by clear API boundaries. |
| NFR006 | Observability | As DevOps, I want logs, metrics, and traces so that I can monitor and troubleshoot the system. | The system should integrate with cluster OpenTelemetry instrumentation for logs/traces; app provides minimal /api/metrics endpoints for runtime counters. |
| NFR007 | Portability | As a developer, I want the app deployable anywhere so that I’m not locked into one environment. | The system should be fully containerized and deployable on Kubernetes via Helm charts, supporting both dev and production clusters. |
| NFR008 | Testability | As a developer, I want automated testing so that I can ensure high quality and reduce bugs. | The system should have >80% unit and integration test coverage, with Jest/Vitest coverage (Istanbul) integrated into the GitHub Actions pipeline. |
| NFR009 | Usability | As a customer, I want an intuitive interface so that I can shop easily without confusion. | The system should provide a simple UI/UX for product browsing, checkout, and account management, with accessibility best practices in mind. |
| NFR010 | Compliance | As a business, I want compliance with data protection standards so that we avoid legal issues. | The system should comply with GDPR-like principles (data privacy, consent, right-to-forget) and use secure data handling practices. |

## Notes
- The chosen stack is Node/Next.js + TypeScript with GitHub Actions for CI/CD.
- CD uses Kubernetes with Helm. Self-hosted runner performs helm upgrade --install with environment-specific values.
- Ingress: NGINX (className: nginx), exposed via Cloudflared tunnel to the ingress controller. Hostname: ace-next.kunlecreates.org.
- Storage: SQLite on a PVC (single-replica only). When scaling horizontally, migrate to Postgres/MySQL and disable the PVC. Deployment uses Recreate strategy when PVC is enabled.
- Secret management: Secrets are applied by the CD workflow (not created by the chart) and referenced by the release (`<release>-secrets` by default).
