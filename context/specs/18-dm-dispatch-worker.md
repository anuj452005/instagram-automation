# Unit 18: Rate-Limited DM Dispatch Worker

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/`)

## Goal
Implement the BullMQ `dm-sender` queue and worker to execute Meta Graph API DM sends with account-level rate limits and random delay jitter.

## Why This Unit Exists
To ensure outbox direct messages are throttled to 30 DMs/min per connected profile with jitter, avoiding Meta spam detection filters.

## Dependencies
- Unit 16: Automation Keyword Matcher
- Unit 17: DM Jobs Database Schema

## Features Delivered
- `dm-sender` queue initialization.
- Dynamic group rate-limiting config keyed by `instagram_account_id`.
- Decryption service integrations fetching Page tokens.
- Outbound Meta Graph API messaging client integration.

## File Structure
```
backend/src/
├── queues/
│   └── dm.queue.ts
└── workers/
    └── dm-sender.worker.ts
```

## Success Criteria
- Matching comments successfully enqueue `dm-sender` jobs.
- Sequential comment triggers are delayed and spaced by 2-second rate-limits.
- Stored `dm_jobs` statuses update to `sent` or log errors on failure.
