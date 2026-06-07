# Master Build Plan: Instagram Comment-to-DM Automation SaaS

This document serves as the master index for the 33 boundary-isolated, single-purpose implementation units that comprise the build roadmap for Gramflow. Each unit is detailed in its own markdown specification file under the `context/specs/` directory.

## Implementation Rules
1. **Single-Boundary Units**: Each unit stays strictly within one system boundary:
   - **Persistence Boundary** (`db/`): Database tables, migrations, constraints.
   - **API Interface Boundary** (`backend/src/routes/`, `controllers/`, `middleware/`): Express HTTP routes, schema validation, gateway logic.
   - **Durable Queue Boundary** (`backend/src/queues/`, `workers/`): BullMQ queue setups, background job worker logic.
   - **Client Boundary** (`frontend/src/`): React dashboard layouts, custom hooks, pages, styles.
2. **Just-in-Time Dependencies**: Never install libraries or build schemas before they are strictly needed by the current unit.
3. **One Visible Result per Unit**: Each unit must compile and produce a developer-verifiable or user-visible outcome.

---

## Numbered List of Units in Build Order

### Phase 1: Foundation Setup
1. **[Unit 01: Database Infrastructure and Migrator Setup](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/01-database-infra.md)**
   - **Boundary**: Persistence Boundary
   - **Builds**: Docker Compose config (Postgres 16, Redis 7), Drizzle ORM config, `db/migrate.ts` runner script.
   - **Dependencies**: None.
2. **[Unit 02: Backend Gateway and Service Health Check](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/02-backend-health.md)**
   - **Boundary**: API Interface Boundary
   - **Builds**: Express app shell, Zod environment loader, and `/health` connection status check.
   - **Dependencies**: Unit 01.
3. **[Unit 03: Frontend Skeleton and Theme Integration](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/03-frontend-skeleton.md)**
   - **Boundary**: Client Boundary
   - **Builds**: Vite + React template, Axios client instance, Tailwind OKLCH neon-dark colors config.
   - **Dependencies**: Unit 02.

### Phase 2: Auth Sync & User Profile
4. **[Unit 04: User Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/04-user-schema.md)**
   - **Boundary**: Persistence Boundary
   - **Builds**: `users` table schema, index scopes, and baseline migration.
   - **Dependencies**: Unit 01.
5. **[Unit 05: Backend Auth Sync Middleware](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/05-backend-auth-sync.md)**
   - **Boundary**: API Interface Boundary
   - **Builds**: Clerk Express JWT verifier, on-demand user sync middleware, and `/api/auth/me` endpoints.
   - **Dependencies**: Unit 02, Unit 04.
6. **[Unit 06: Frontend Clerk Authentication Integration](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/06-frontend-auth.md)**
   - **Boundary**: Client Boundary
   - **Builds**: React Clerk auth pages (`/login`), route guards, and dashboard shell navbar.
   - **Dependencies**: Unit 03, Unit 05.

### Phase 3: Instagram Account Linkages
7. **[Unit 07: Instagram Account Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/07-instagram-account-schema.md)**
   - **Boundary**: Persistence Boundary
   - **Builds**: `instagram_accounts` table columns, unique owner index scopes, and migration.
   - **Dependencies**: Unit 04.
8. **[Unit 08: Instagram Token Exchange & Linking API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/08-token-exchange-api.md)**
   - **Boundary**: API Interface Boundary
   - **Builds**: AES-256-GCM encryption helper, Meta Graph endpoints to retrieve listable pages, and linking handlers.
   - **Dependencies**: Unit 05, Unit 07.
9. **[Unit 09: Frontend Accounts Dashboard](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/09-frontend-accounts.md)**
   - **Boundary**: Client Boundary
   - **Builds**: Accounts config manager screen, linking dashboard cards, connection toggles.
   - **Dependencies**: Unit 06, Unit 08.

### Phase 4: Automation Campaigns
10. **[Unit 10: Automations Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/10-automation-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `automations` and `automation_keywords` tables with foreign keys and cascade rules.
    - **Dependencies**: Unit 07.
11. **[Unit 11: Automations CRUD API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/11-automation-crud-api.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: CRUD controllers for configure rules, Zod payload validators, and route isolation keys.
    - **Dependencies**: Unit 08, Unit 10.
12. **[Unit 12: Frontend Automation Builder](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/12-frontend-builder.md)**
    - **Boundary**: Client Boundary
    - **Builds**: Automation builder layout screen, keyword tag list input, response template drafts.
    - **Dependencies**: Unit 09, Unit 11.

### Phase 5: Webhook Ingest & Queue Routing
13. **[Unit 13: Webhook Logging Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/13-webhook-logging-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `webhook_events` schema tracking payload ingestion and status.
    - **Dependencies**: Unit 10.
14. **[Unit 14: Meta Webhook Ingestion API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/14-webhook-ingestion-api.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: Webhook signature verification, challenge endpoint handler, and Redis-based payload deduplication checks.
    - **Dependencies**: Unit 11, Unit 13.
15. **[Unit 15: Ingest Queue & Comment Worker](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/15-comment-ingest-worker.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: BullMQ queue infrastructure connection setups, `comment-ingest` queue, and basic worker parser.
    - **Dependencies**: Unit 14.
16. **[Unit 16: Automation Keyword Matcher](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/16-keyword-matcher.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: Text keyword matcher logic (Exact/Contains/StartsWith) evaluating trigger comments.
    - **Dependencies**: Unit 15.

### Phase 6: Direct Message Outbox
17. **[Unit 17: DM Jobs Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/17-dm-jobs-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `dm_jobs` table and unique filter index checking for duplicate messages.
    - **Dependencies**: Unit 10.
18. **[Unit 18: Rate-Limited DM Dispatch Worker](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/18-dm-dispatch-worker.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: `dm-sender` queue, worker with BullMQ per-account limits (1 send / 2s), jitter implementation, and Meta `/messages` sender.
    - **Dependencies**: Unit 16, Unit 17.

### Phase 7: Interactive Lead Collection
19. **[Unit 19: Leads Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/19-leads-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `leads` table and unique campaign-user constraints.
    - **Dependencies**: Unit 17.
20. **[Unit 20: Conversational Lead Capturing Worker](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/20-lead-capturing-worker.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: Redis session tracking logic, validation regex (emails and +91 Indian phone numbers), and state machine.
    - **Dependencies**: Unit 18, Unit 19.
21. **[Unit 21: Landing Page Submission API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/21-landing-page-api.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: Public `/api/public/leads/submit` route for web fallback lead capture.
    - **Dependencies**: Unit 19.
22. **[Unit 22: Frontend Leads Manager & Public Forms](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/22-frontend-leads.md)**
    - **Boundary**: Client Boundary
    - **Builds**: Leads table with CSV download, public mobile-responsive landing form `/l/:token`.
    - **Dependencies**: Unit 12, Unit 21.

### Phase 8: Automation Scheduling
23. **[Unit 23: Scheduled Automation Activation Scheduler](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/23-scheduled-activation.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: Repeatable BullMQ cron scanner checking and activating scheduled drafts.
    - **Dependencies**: Unit 16.

### Phase 9: Real-time Analytics
24. **[Unit 24: Analytics Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/24-analytics-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `analytics_events` audit table and `analytics_snapshots` aggregation table.
    - **Dependencies**: Unit 19.
25. **[Unit 25: Analytics Events Tracker Worker](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/25-analytics-tracker.md)**
    - **Boundary**: Durable Queue Boundary
    - **Builds**: Asynchronous event queue tracker logging events and updating daily metric aggregates.
    - **Dependencies**: Unit 18, Unit 24.
26. **[Unit 26: Frontend Analytics Metrics](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/26-frontend-analytics.md)**
    - **Boundary**: Client Boundary
    - **Builds**: Analytics charts using Recharts for views/conversions/leads dashboard home.
    - **Dependencies**: Unit 22, Unit 25.

### Phase 10: Razorpay Recurring Subscriptions
27. **[Unit 27: Billing Database Columns](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/27-billing-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: Stripe/Razorpay customer IDs and billing status fields on `users` table.
    - **Dependencies**: Unit 04.
28. **[Unit 28: Razorpay Webhooks and Checkout API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/28-razorpay-api.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: Subscription creation API, webhooks parser and verify signatures.
    - **Dependencies**: Unit 05, Unit 27.
29. **[Unit 29: Plan Limits Enforcement Middleware](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/29-plan-limits-middleware.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: Middleware checks for linked account counts, active automations, and monthly DM send capacity.
    - **Dependencies**: Unit 28.
30. **[Unit 30: Frontend Billing & Pricing Plans](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/30-frontend-billing.md)**
    - **Boundary**: Client Boundary
    - **Builds**: Plans selection matrix screen, Razorpay widget bindings, and settings quota tracking.
    - **Dependencies**: Unit 06, Unit 29.

### Phase 11: System Administration & Audit logs
31. **[Unit 31: Audit Logs & Admin Database Schema](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/31-audit-logs-schema.md)**
    - **Boundary**: Persistence Boundary
    - **Builds**: `audit_logs` and `admin_users` tables.
    - **Dependencies**: Unit 04.
32. **[Unit 32: System Administration & Queue Monitor API](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/32-admin-queues-api.md)**
    - **Boundary**: API Interface Boundary
    - **Builds**: System MRR/metrics endpoint and Bull Board queues dashboard route.
    - **Dependencies**: Unit 05, Unit 31.
33. **[Unit 33: Frontend Admin Workspace](file:///c:/gitandgithub/project2026/instagram-automaiton/context/specs/33-frontend-admin.md)**
    - **Boundary**: Client Boundary
    - **Builds**: Admin console views showing system statuses, users settings, and queue metrics.
    - **Dependencies**: Unit 06, Unit 32.
