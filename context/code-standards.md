# Code Standards & Conventions

This document defines the code standards, engineering conventions, styling rules, and folder organizations for the project. All contributions must adhere strictly to these rules to maintain a cohesive, clean, and extensible codebase.

---

## 1. General Principles

- **Single-Purpose Modules**: Keep functions, hooks, and services focused on a single responsibility. If a module performs multiple unrelated actions, split it.
- **Fail Fast & Explicitly**: Validate all incoming parameters, configurations, and environment variables at the system boundary. Avoid silent fallbacks.
- **Clean Architecture Boundaries**: Do not mix user-facing routing logic with queue processors. Keep database operations inside services/repositories rather than writing raw queries inside Express controller functions.

---

## 2. TypeScript & Type Safety

- **Strict Mode**: `strict: true` is enabled in all `tsconfig.json` configurations and must never be disabled.
- **Zero `any` Occurrences**: The `any` type is strictly forbidden. Use `unknown` for unsafe boundaries and cast it using Zod schema parses. Use explicit interfaces or narrow types (`Record<string, unknown>`) elsewhere.
- **Zod for Boundary Validation**: Every boundary (API requests, database JSON fields, environment variables) must use a corresponding Zod schema to validate and parse data. Use `z.infer<typeof schema>` to generate matching TypeScript types automatically.
- **Type Inference**: Leverage TypeScript's type inference where obvious (e.g., local variables), but explicitly declare return types on all exported functions, services, and API controllers.

---

## 3. Frontend Conventions (React & Vite)

- **Component Structure**:
  - Keep components modular. Separate layout components from stateful data-fetching components.
  - Define components as functional components: `export const MyComponent: React.FC<Props> = ({ prop }) => { ... }`.
  - Prohibit inline styling. Use TailwindCSS class names exclusively.
- **TanStack Query (React Query)**:
  - Centralize all query keys in a static factory object to prevent cache misalignments:
    ```typescript
    export const queryKeys = {
      automations: {
        all: ['automations'] as const,
        detail: (id: string) => ['automations', id] as const,
      },
      leads: (automationId?: string) => ['leads', { automationId }] as const,
    };
    ```
  - Always separate mutations from queries. Use `useMutation` with optimistic updates for immediate UI feedback.
- **Zustand State Management**:
  - Keep Zustand stores small, simple, and action-driven.
  - Avoid storing large data blocks (e.g., API lists) in Zustand; use TanStack Query cache instead. Zustand should handle transient UI states (sidebar state, active builder node selection).

---

## 4. API & Route Structure (Express)

- **Consistent Middleware Chain**: Every protected API route must strictly follow this middleware execution chain:
  1. `clerkMiddleware`: Validates Clerk JWT, injects `req.auth`.
  2. `syncUser`: Syncs user to local PostgreSQL DB on-demand, injects `req.user`.
  3. `validateRequest(schema)`: Validates body, query, and params via Zod, returning `422 Unprocessable Entity` on validation failure.
  4. `checkPlanLimits`: Middleware verifying the request does not exceed user's subscription limits.
  5. `ControllerHandler`: Resolves request logic.
- **Standardized Error Handling**:
  - Implement a global Express error-handling middleware that catches all uncaught exceptions, logs them with Pino, and formats standard JSON error payloads.
  - **Error Response Shape**:
    ```json
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE_STRING",
        "message": "Human-friendly explanation.",
        "details": []
      }
    }
    ```
  - Use semantic HTTP status codes:
    - `400 Bad Request` — Syntax/payload problems.
    - `401 Unauthorized` — JWT token missing/invalid.
    - `403 Forbidden` — Correct token, but lacking ownership/privileges.
    - `404 Not Found` — Resource missing.
    - `402 Payment Required` — Plan limit reached.
    - `422 Unprocessable Entity` — Schema validation fails.
    - `500 Internal Server Error` — Unhandled exceptions.

---

## 5. Database & ORM (Drizzle)

- **Strict Schema Definitions**:
  - All database schema files must reside under `db/schema.ts` (or separated files imported into `db/schema.ts`).
  - Table name variables must use camelCase matching their database names: `export const instagramAccounts = pgTable('instagram_accounts', { ... })`.
  - Always define explicit foreign key cascade rules (e.g. `onDelete: 'cascade'`) to prevent orphan records.
- **Migration Workflows**:
  - Never modify migrations manually. Generate them exclusively via `npx drizzle-kit generate`.
  - Apply migrations automatically on startup/deployment using a dedicated migrator script `db/migrate.ts` executing the SQL files.
- **Drizzle Client Usage**:
  - Centralize client initialization inside `backend/src/config/db.ts` as a pool singleton with `max: 20` connections (tuned for Azure Container Apps).

---

## 6. Queue & Worker Conventions (BullMQ)

- **Separate Queue/Worker Processes**:
  - Although workers are compiled into the same Express container at MVP to minimize costs, keep worker logic logically detached from API routes.
  - Workers must import separate connection modules and execute inside their own event loops.
- **Graceful Error Boundaries**:
  - Worker logic must wrap core actions in `try/catch` blocks.
  - Categorize failures:
    - **Transient Failures** (e.g. Meta rate limits, network timeouts): Throw errors to force BullMQ to retry the job using the retry backoff schedule.
    - **Fatal Failures** (e.g. Deleted target posts, user token revoked): Update job status to `failed`, log it, record an audit event, and gracefully exit the job thread.
- **Atomic Operations**:
  - Workers must check and update progress atomically to prevent double DMs or duplications (e.g. unique keys in `dm_jobs` and Redis deduplication).

---

## 7. Styling Rules (TailwindCSS)

- **Semantic Color Tokens**: Use Tailwind configuration color variables corresponding to the UI Context system. Avoid hardcoded hex colors (`#7C3AED` -> `text-primary` or `bg-primary`).
- **Consistent Rounded Corners Scale**: Use standard Tailwind radius configurations (`rounded-lg`, `rounded-xl`, `rounded-full`) according to rules defined in `ui-context.md`.
- **Responsive Classes**: Always design mobile-first. Apply layouts using standard media prefix modifiers (`md:`, `lg:`).

---

## 8. Directory File Scaffolding (Reference)

```
instagram-automation/
├── db/                       # Shared Database Folder
│   ├── schema.ts             # Tables, indices, constraints
│   ├── migrate.ts            # Migration runner
│   └── migrations/           # Auto-generated SQL migrators
│
├── backend/                  # REST API & Workers Package
│   ├── src/
│   │   ├── config/           # Database pools, Redis clients, Env vars
│   │   ├── controllers/      # Route request/response handlers
│   │   ├── cron/             # Scheduled repeatable jobs (token renew)
│   │   ├── middleware/       # Clerk, sync, limiters, validation checks
│   │   ├── queues/           # BullMQ queue instantiations
│   │   ├── routes/           # Express router files
│   │   ├── services/         # Core business logic blocks
│   │   ├── workers/          # BullMQ queue event consumers
│   │   ├── app.ts            # Express server configuration
│   │   └── index.ts          # Server listener startup
│
└── frontend/                 # Client React SPA Package
    ├── src/
    │   ├── components/       # Shared reusable UI elements
    │   ├── hooks/            # TanStack Query custom wrappers
    │   ├── lib/              # Client configurations (Axios base, Clerk keys)
    │   ├── pages/            # View pages (Dashboard, Builder, Leads, Pricing)
    │   └── stores/           # Zustand store slices (transient UX state)
```
