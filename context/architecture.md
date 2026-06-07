# System Architecture Context

This document defines the technology stack, folder/system boundaries, storage allocations, security/access models, background queue mechanics, and system invariants for the Instagram Comment-to-DM automation SaaS.

---

## 1. Tech Stack

| Layer | Technology | Role / Responsibility |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS | SPA dashboard, leads table, builder canvases, and landing pages. |
| **Client State** | Zustand | Light client-side state manager (sidebar toggles, workspace builder nodes). |
| **Server State** | TanStack Query (React Query) | Handles server request caching, optimistic updates, and background refetching. |
| **Auth Gateway** | Clerk Auth (Facebook Connection) | Manages signup, login sessions, and extracts user Facebook tokens. |
| **API Gateway** | Node.js, Express, TypeScript | REST endpoints, webhook ingestion, signature checking, and DB syncing. |
| **Database & ORM** | PostgreSQL 16, Drizzle ORM | Relational data persistence; migrations generated and run via Drizzle-kit. |
| **Background Queues** | Redis 7, BullMQ | Job queueing, per-account rate limit controls, retry backoff, and DLQ routing. |
| **Cache & Sessions** | Redis 7 | Webhook event deduplication, conversational lead flow session states. |
| **Payments** | Razorpay SDK | Recurring INR subscription billing, UPI mandates, and webhook processing. |
| **Email Dispatch** | Resend SDK | Sending system notifications, passwordless login tokens, and billing alerts. |
| **Structured Logging** | Pino | High-speed JSON logger for container performance and audit compliance. |
| **Hosting Platform** | Azure Static Web Apps (SWA) | Hosting and CDN caching of static frontend bundles. |
| **Compute Engine** | Azure Container Apps (ACA) | Scalable Express API & worker containers configured to scale-to-zero when idle. |

---

## 2. System Boundaries

The repository is structured as a TypeScript monorepo containing distinct boundaries of ownership:

- **`frontend/src/`** — **Client Boundary**
  - Owns all user interaction views, pricing modals, lead dashboards, and auth forms.
  - Connects to Clerk using `<ClerkProvider>` and interacts with the API solely via Axios HTTP requests passing bearer tokens.
  
- **`backend/src/routes/` & `controllers/`** — **API Interface Boundary**
  - Owns HTTP request parsing, Zod parameter validation, and routing.
  - Verifies JWT tokens via Clerk's Express middleware, registers users on-demand, and processes incoming webhooks (Meta, Razorpay).
  
- **`backend/src/queues/` & `workers/`** — **Durable Queue Boundary**
  - Owns asynchronous task runners (ingest, matching, sending, lead parsing).
  - Keeps computation detached from the Express event loop to prevent server blocking.

- **`db/`** — **Persistence Boundary**
  - Owns schema definitions (`db/schema.ts`), seed fixtures (`db/seed.ts`), and migrator CLI commands.
  - Acts as the single source of truth for PostgreSQL relational schemas.

---

## 3. Storage Model

Data is segregated across storage mediums according to access patterns, durability requirements, and performance costs:

- **PostgreSQL 16 (Durable SQL Database)**
  - *Data Types*: User records, linked Instagram profiles, active automation rules, keywords, logged message tasks (`dm_jobs`), collected customer leads, raw audit logs, daily aggregated metric snapshots (`analytics_snapshots`).
  - *Invariants*: Access tokens (Facebook Page long-lived tokens) are encrypted in the column `fb_page_access_token` using AES-256-GCM.
  
- **Redis 7 (Volatile In-Memory Storage & Cache)**
  - *Data Types*: 
    - Webhook event IDs (`webhook:dedup:<event_id>`) with a strict 24-hour TTL to prevent double execution.
    - Conversational state hashes (`lead_session:<ig_scoped_user_id>`) with a 1-hour TTL tracking the current step in the DM lead flow.
    - BullMQ locks, states, and scheduling parameters.
  
- **Azure Static Web Apps / CDN (Static Assets)**
  - *Data Types*: Pre-built client HTML, CSS, JavaScript, landing page forms, logo files, and fonts.
  - *Note*: Ephemeral CSV files generated for lead exports are streamed directly to the HTTP buffer rather than stored on disk.

---

## 4. Auth and Access Model

- **Authentication**: Authentication is handled by Clerk via Facebook Social Connection. React client requests the JWT token on route changes, passing it in the `Authorization: Bearer <clerk_jwt>` header to backend endpoints. Express verifies the token signature against Clerk's public JWKS.
- **On-Demand Synchronization**: The backend `syncUser` middleware checks for the user's corresponding `users.clerk_user_id` inside our PostgreSQL database on each request. If not found, it inserts the record using token claims (email, name) and attaches the database user object to `req.user`.
- **Tenant Isolation**: Users only have access to their own data. Every PostgreSQL operation for a protected route must explicitly filter by the authenticated `req.user.id`. Row ownership is strictly checked before updates or deletes are executed.
- **Meta Token Lifecycle**: The user's short-lived Facebook OAuth token is fetched from Clerk's Backend SDK (`clerkClient.users.getUserOauthAccessToken`) only when linking new pages. Once linked, the backend exchanges it for a 60-day Page Access Token, encrypts it, and stores it in PostgreSQL. The worker process decrypts this token strictly in-memory during DM sends.

---

## 5. Background Task and Queue Model

BullMQ handles asynchronous workloads across four persistent Redis-backed queues:

```
[Meta Webhook comment] ──▶ API ──▶ Ingest Queue ──▶ Ingest Worker ──▶ Matcher Engine
                                                                         │
                                                                         ▼
                                      Send Worker ◀── Send Queue ◀───────┘
                                          │
                                          ▼
                                   [Instagram DM]
```

1. **`comment-ingest`**: Reads incoming Meta comment webhook payloads. The worker matches the comment text against active rules, verifies tenant limits, and enqueues a sending job.
2. **`dm-sender`**: Manages outbound DMs. The worker applies a group rate limiter (max 1 send per 2 seconds per `instagram_account_id` to comply with Meta limits), injects a random 1–3 second delay (jitter), decrypts the Page Access Token, and POSTs to Meta.
3. **`lead-processor`**: Processes incoming DM messages from users during interactive flows. It updates Redis state machine states and records leads.
4. **`scheduled-jobs`**: A repeatable scheduler running every 60 seconds to scan and activate draft automations whose scheduled publish time has arrived.

---

## 6. System Invariants (Strict Architectural Rules)

The codebase must strictly adhere to these rules. Code reviews and automation tests must verify they are never broken:

1. **Strict Tenant Isolation**: All endpoints modifying or retrieving data (automations, leads, accounts) MUST explicitly filter query scopes using the authenticated user record (`req.user.id`). Never expose endpoints that permit fetching or mutating rows via route parameter IDs without verifying matching owner ownership.
2. **Non-Blocking Webhook Handlers**: The webhook ingestion route (`POST /api/webhooks/instagram`) must never perform heavy DB queries, lock transactions, or make outgoing Meta API requests. It must verify the `x-hub-signature-256` payload signature, check event deduplication in Redis, write the raw payload to the event log, enqueue to BullMQ, and return a `200 OK` response within **200ms**.
3. **Throttled Outbound Dispatch Only**: Direct Meta API calls to send DMs from API gateway request threads are strictly forbidden. All DMs must be enqueued via the `dm-sender` queue to guarantee rate limits (30 DMs/minute per account, 195 DMs/hour cap) and human-emulated jitter are enforced.
4. **At-Rest Token Encryption**: Meta Page Access Tokens must never be stored in plain text. They must always be encrypted using `AES-256-GCM` before database insertion (`instagram_accounts.fb_page_access_token`) and only decrypted in-memory during worker execution.
5. **No Local Auth Credentials**: The database must never contain email/password columns or custom password hash structures. All user session validation and identity management must be delegated to Clerk.
6. **Atomic Snapshots Updates**: Incrementing metrics for dashboard analytics must always be performed via atomic SQL operations (`INSERT ... ON CONFLICT (instagram_account_id, automation_id, date) DO UPDATE SET ...`) to guarantee consistency and avoid race conditions during high-concurrency webhook bursts.
