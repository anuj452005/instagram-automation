# Unit 23: Scheduled Automation Activation Scheduler

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/`)

## Goal
Implement a repeatable BullMQ cron worker running every 60 seconds to scan for drafts with elapsed scheduled activation times and set them to active.

## Why This Unit Exists
To support automated, hands-off campaign scheduling, aligning with creators' content publishing times.

## Dependencies
- Unit 16: Automation Keyword Matcher

## Features Delivered
- BullMQ repeatable job configuration (`scheduled-jobs`).
- Scanner service checking for pending campaign activations.

## File Structure
```
backend/src/
├── queues/
│   └── scheduler.queue.ts
└── workers/
    └── scheduler.worker.ts
```

## Success Criteria
- Enqueuing a draft automation set to publish 1 minute in the future updates to active state automatically when the scheduler runs.
