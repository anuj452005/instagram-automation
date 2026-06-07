# AI Workflow Rules & Constraints

This document defines the rules of behavior that you (the AI coding agent) must strictly follow when building, refactoring, or debugging this project. There are no exceptions to these rules.

---

## 1. Development Approach

- **Follow Spec-Driven Development**: You must implement code strictly against the specifications in `implementation_plan.md` and `plan2.md`. Never invent or guess product behaviors.
- **Develop Incrementally**: Make changes in small, logical, and independently verifiable steps. Do not attempt to deliver multiple units of the roadmap in a single pass.

---

## 2. Scoping Rules

- **Work on One Unit at a Time**: Focus your execution on exactly one task unit as defined in `progress-tracker.md` and the implementation plans. You must complete, test, and verify the active unit before touching code related to any subsequent units.
- **Prohibit Speculative Changes**: Do not add "helper" functions, database fields, configurations, or UI panels that are not immediately required by the current unit. If a feature is scheduled for a later phase or V2, do not write placeholders or preparatory code for it now.
- **Isolate Architecture Boundaries**: Do not combine database schema changes, backend route handlers, worker queues, and frontend screens in a single file-modification request. Commit or request approval for database and queue logic before implementing the user interfaces.

---

## 3. When to Split Work

You must partition a task unit into smaller steps if any of the following conditions are met:
- **Crossing Boundaries**: The change modifies database tables, enqueues background worker jobs, and implements frontend views concurrently. Break this into (1) Database migrations and schemas, (2) Express API controllers and webhooks, (3) Queue workers and rate limiters, and (4) Frontend pages and hooks.
- **Large Test Surface**: The unit requires verification across multiple external APIs (e.g., Clerk Auth tokens, Meta comment webhooks, and Razorpay subscriptions). Test each integration mockup individually before combining them.
- **High Complexity**: A step takes more than three file edits or touches more than 250 lines of code.

---

## 4. Handling Ambiguity and Missing Requirements

- **Do Not Guess**: If a requirement is missing, conflicting, or ambiguous in the context files, you must stop immediately.
- **Document Questions**: Write down the ambiguity as an open question in the "Open Questions" section of `context/progress-tracker.md`.
- **Ask the User Explicitly**: Present the query to the user. Do not write a single line of code matching the ambiguous logic until the user provides clarification and you have updated the corresponding markdown specification to reflect the decision.

---

## 5. Protected Files

You must never modify the following directories or files without explicit instructions from the user:
- **`components/ui/*`**: These are generated UI library components (e.g., radix-ui, shadcn/ui components). Any customization must happen in custom wrappers or app-level styles, not inside these base files.
- **`ui/dashboard/code.js`**: This is a mock UI layout and high-fidelity page reference. Use it as design and CSS copy-paste inspiration, but do not overwrite it or edit it directly.
- **Third-party `node_modules` and config overrides**: Avoid editing raw configuration files (`tsconfig.json`, `tailwind.config.js`, `vite.config.ts`) unless the unit specifically demands it.

---

## 6. Keeping Documentation in Sync

- **Update Progress Tracker Immediately**: You must edit `context/progress-tracker.md` immediately after completing any unit or updating task statuses. Mark completed tasks with `- [x]`.
- **Update Architecture & Schema Docs**: If an implementation detail changes a database schema, an environment variable, an API endpoint signature, or a Redis cache key, you must update `context/architecture.md` and `context/code-standards.md` before committing the file changes.
- **No Stale Documentation**: Ensure that all markdown documentation matches the code reality. Stale documentation is considered a failure of delivery.

---

## 7. Pre-Transition Verification Checklist

Before marking a unit as complete and requesting approval to move to the next unit, you must run and verify the following checklist:

1. **Build Verification**: Run `npm run build` from the workspace root (or package folders). The build must pass with zero TypeScript compiler errors or linter warnings.
2. **Test Coverage**: Run all database migrations and unit/integration tests for the modified sections. Confirm tests pass.
3. **Invariant Check**: Read the "System Invariants" section of `context/architecture.md`. Verify by inspection that your implemented changes do not violate any of the six invariants.
4. **Local Verification**: Propose the necessary terminal commands or run servers locally to test the flow end-to-end (e.g., hitting the `/health` checks, verifying SQLite/PostgreSQL values, testing webhook verification outputs).
5. **Update progress-tracker.md**: Log the completed tasks and update the "Current Goal" and "In Progress" sections.
