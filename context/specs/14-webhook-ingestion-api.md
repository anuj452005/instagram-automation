# Unit 14: Meta Webhook Ingestion API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Implement endpoints to verify subscriptions from Meta and securely capture comment webhook payloads under strict timing controls.

## Why This Unit Exists
To provide a secure entry point for Instagram interaction triggers, verifying signatures and logging events before background queue handoffs.

## Dependencies
- Unit 11: Automations CRUD API
- Unit 13: Webhook Logging Schema

## Features Delivered
- Meta verification challenge endpoint (`GET /api/webhooks/instagram`).
- timing-safe signature verification middleware using raw payload buffers (`x-hub-signature-256`).
- Redis-based event deduplication logic checking for re-delivered payloads.

## File Structure
```
backend/src/
├── controllers/
│   └── webhooks.controller.ts
├── routes/
│   └── webhooks.ts
└── services/
    └── webhook-verifier.service.ts
```

## API Contracts
### GET `/api/webhooks/instagram`
- **Query Params**: `hub.mode`, `hub.challenge`, `hub.verify_token`
- **Response Shape**: Plain text of the challenge string.

### POST `/api/webhooks/instagram`
- **Headers**: `x-hub-signature-256`
- **Request Body**: Raw Meta comment event payload.
- **Response**: `200 OK` (with timing guarantee of sub-200ms).

## Success Criteria
- Simulating a mock GET request with a valid verify token returns the challenge code.
- Posting a comment payload with a valid signature logs it in the database and returns `200 OK`.
- Posting an invalid signature returns `403 Forbidden`.
