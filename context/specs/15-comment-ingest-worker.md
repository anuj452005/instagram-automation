# Unit 15: Ingest Queue & Comment Worker

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/`)

## Goal
Configure the BullMQ `comment-ingest` queue and set up a background worker to extract comment payload details off the Express thread.

## Why This Unit Exists
To ensure incoming webhook requests are processed asynchronously, avoiding webhook drops and preventing Meta connection timeout penalties under high-traffic events.

## Dependencies
- Unit 14: Meta Webhook Ingestion API

## Features Delivered
- BullMQ shared connection module.
- `comment-ingest` queue initialization.
- Background worker consumer skeleton reading incoming events.

## File Structure
```
backend/src/
├── queues/
│   ├── connection.ts
│   └── comment.queue.ts
└── workers/
    └── comment.worker.ts
```

## Success Criteria
- Simulating a POST webhook comment triggers enqueue actions.
- The background worker executes and outputs logs containing the commenter's ID and post ID.
