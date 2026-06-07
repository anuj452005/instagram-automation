# Unit 25: Analytics Events Tracker Worker

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/` / services)

## Goal
Implement a fire-and-forget service that logs raw events asynchronously and upserts analytics snapshots using atomic database updates.

## Why This Unit Exists
To ensure dashboard metrics are computed in the background, preventing analytics processing from blocking the core messaging pipelines.

## Dependencies
- Unit 18: Rate-Limited DM Dispatch Worker
- Unit 24: Analytics Database Schema

## Features Delivered
- Core `AnalyticsTracker` service.
- Integration inside queue workers to trigger logs on successes/failures.
- Atomic SQL aggregation upserts.

## File Structure
```
backend/src/
└── services/
    └── analytics.service.ts
```

## Success Criteria
- Mocking a DM dispatch triggers an event log entry and increments the appropriate `analytics_snapshots` count.
- Conflicting simultaneous database updates are resolved safely via `ON CONFLICT` constraints.
