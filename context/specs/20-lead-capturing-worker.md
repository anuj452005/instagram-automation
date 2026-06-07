# Unit 20: Conversational Lead Capturing Worker

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/`)

## Goal
Implement a Redis-backed session manager and a Zod/regex parser to validate follower emails and phone numbers inside active Instagram conversations.

## Why This Unit Exists
To support automated lead capture flows directly within Instagram DM conversations, prompting users for information and processing their replies.

## Dependencies
- Unit 18: Rate-Limited DM Dispatch Worker
- Unit 19: Leads Database Schema

## Features Delivered
- Redis lead flow session manager with 1-hour expiration timeouts.
- Email and 10-digit Indian phone number regex parser services.
- `lead-processor` queue and worker handling direct messages.

## File Structure
```
backend/src/
├── services/
│   ├── lead-session.service.ts
│   └── lead-parser.service.ts
└── workers/
    └── lead-processor.worker.ts
```

## Redis Changes
- Session keys: `lead_session:<ig_user_id>` with 1-hour TTL.

## Success Criteria
- Simulating a message reply triggers active session checks in Redis.
- Valid email strings are parsed, saved to the `leads` table, and trigger the final DM template dispatch.
- Invalid formats reply with validation warning DMs.
