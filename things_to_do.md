# GramFlow Project Progress

## Done
- [x] **Unit 13: Webhook Logging Schema** — Database schema for raw Meta webhook events and tracking.
- [x] **Unit 14: Meta Webhook Ingestion API** — GET verification, timing-safe signature checking, and Redis deduplication.
- [x] **Unit 15: Ingest Queue & Comment Worker** — BullMQ connection, `comment-ingest` queue, and background processing daemon.

## Next Steps

### 1. Webhook Setup on Meta Developer Dashboard
- Update local ngrok agent version with `ngrok update`.
- Start HTTPS tunnel on port 3000: `ngrok http 3000`.
- Register Callback URL `https://<your-subdomain>.ngrok-free.app/api/webhooks/instagram` and Verify Token `gramflow_verify_token` in the Meta Developer Console.
- Subscribe to the `comments` webhook field under the Instagram object.

### 2. Upcoming Units
- [ ] **Unit 16: Keyword Matcher** — Extract keyword matching logic to check comment text against active automations.
- [ ] **Unit 17: DM Jobs Schema** — Database schema for tracking DM queue/dispatch status.
- [ ] **Unit 18: DM Dispatch Worker** — Dispatch messages using Instagram Graph API inside a background worker.
- [ ] **Unit 19 & 20: Leads Schema & Lead Capturing Worker** — Capture commenter details, emails, and phone numbers in database.
- [ ] **Unit 21 & 22: Landing Page & Leads UI** — Build lead collection pages and dashboard views.
- [ ] **Unit 23: Scheduled Activation** — Start automations on specific scheduled times.
- [ ] **Unit 24 - 26: Analytics** — Schema, tracking hooks, and frontend dashboard for automation metrics.
- [ ] **Unit 27 - 30: Billing & Subscription** — Integrate Razorpay subscriptions and plan limits.
- [ ] **Unit 31 - 33: Admin Panel** — Audit logs, queue management, and admin dashboard.