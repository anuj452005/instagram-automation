# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 0: Project Setup & Specification (Complete)
- Phase 1: Foundation (In progress)

## Current Goal

- Begin Unit 2 implementation (Backend Gateway and Service Health Check).

## Completed

- [x] Define detailed product goals, features, scope, and success criteria in [project-overview.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/project-overview.md).
- [x] Define system architecture, folder boundaries, storage mapping, and invariants in [architecture.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/architecture.md).
- [x] Establish coding conventions, typescript guides, API error formats, and styling standards in [code-standards.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/code-standards.md).
- [x] Formulate agent workflow boundaries, scoping rules, split checkpoints, and pre-transition checks in [ai-workflow-rules.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/ai-workflow-rules.md).
- [x] Define the UI design token system, typography scales, border radiuses, and layout grids in [ui-context.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/ui-context.md).
- [x] Unit 01: Database Infrastructure and Migrator Setup (Persistence)

## In Progress

- None.

## Next Up

- **Unit 02: Backend Gateway and Service Health Check** (API Interface)
- **Unit 03: Frontend Skeleton and Theme Integration** (Client)
- **Unit 04: User Database Schema** (Persistence)
- **Unit 05: Backend Auth Sync Middleware** (API Interface)
- **Unit 06: Frontend Clerk Authentication Integration** (Client)
- **Unit 07: Instagram Account Database Schema** (Persistence)
- **Unit 08: Instagram Token Exchange & Linking API** (API Interface)
- **Unit 09: Frontend Accounts Dashboard** (Client)
- **Unit 10: Automations Database Schema** (Persistence)
- **Unit 11: Automations CRUD API** (API Interface)
- **Unit 12: Frontend Automation Builder** (Client)
- **Unit 13: Webhook Logging Schema** (Persistence)
- **Unit 14: Meta Webhook Ingestion API** (API Interface)
- **Unit 15: Ingest Queue & Comment Worker** (Durable Queue)
- **Unit 16: Automation Keyword Matcher** (Durable Queue)
- **Unit 17: DM Jobs Database Schema** (Persistence)
- **Unit 18: Rate-Limited DM Dispatch Worker** (Durable Queue)
- **Unit 19: Leads Database Schema** (Persistence)
- **Unit 20: Conversational Lead Capturing Worker** (Durable Queue)
- **Unit 21: Landing Page Submission API** (API Interface)
- **Unit 22: Frontend Leads Manager & Public Forms** (Client)
- **Unit 23: Scheduled Automation Activation Scheduler** (Durable Queue)
- **Unit 24: Analytics Database Schema** (Persistence)
- **Unit 25: Analytics Events Tracker Worker** (Durable Queue)
- **Unit 26: Frontend Analytics Metrics** (Client)
- **Unit 27: Billing Database Columns** (Persistence)
- **Unit 28: Razorpay Webhooks and Checkout API** (API Interface)
- **Unit 29: Plan Limits Enforcement Middleware** (API Interface)
- **Unit 30: Frontend Billing & Pricing Plans** (Client)
- **Unit 31: Audit Logs & Admin Database Schema** (Persistence)
- **Unit 32: System Administration & Queue Monitor API** (API Interface)
- **Unit 33: Frontend Admin Workspace** (Client)

## Open Questions

- None.

## Architecture Decisions

- **Clerk Auth + Facebook Social Connection**: Handles user sign-in and retrieval of Facebook Page tokens securely without requiring custom OAuth logic.
- **Razorpay for Payments**: Chosen to native-bills INR with recurring UPI auto-pay and card e-mandates.
- **Azure Container Apps (ACA)**: Enables scale-to-zero for backend and BullMQ worker containers to keep MVP costs under ₹2,000/month.
- **Drizzle ORM**: Selected over Prisma for light footprint, direct TypeScript schema definitions, and better performance in containerized environments.
- **BullMQ + Redis**: Selected for queuing comment events, rate-limiting DM dispatch to 30 DMs/min per account, and keeping an hourly hard safety cap (195 DMs/hr).

## Session Notes

- Configured initial [project-overview.md](file:///c:/gitandgithub/project2026/instagram-automaiton/context/project-overview.md).
- Completed Unit 01 (Database Infrastructure and Migrator Setup) inside the `GramFlow` directory, configured and verified with cloud PostgreSQL migrations.
