# Unit 16: Automation Keyword Matcher

## Boundary
Durable Queue Boundary (`backend/src/queues/` & `workers/` / services)

## Goal
Implement a text matching engine to parse comment text and evaluate active global and post-specific automation triggers.

## Why This Unit Exists
To accurately match incoming interactions against configurations (exact, contains, starts-with), supporting emojis and punctuation isolation.

## Dependencies
- Unit 15: Ingest Queue & Comment Worker

## Features Delivered
- Core keyword parsing and matching service.
- Integration inside `comment-ingest` worker to retrieve active campaigns from PostgreSQL.

## File Structure
```
backend/src/
└── services/
    └── matcher.service.ts
```

## Success Criteria
- Test cases for exact match evaluate successfully (e.g. `"resume"` matches `"resume"` but not `"send resume"`).
- Test cases for contains match evaluate successfully (e.g. `"send resume!"` matches `"resume"`).
- Ingest worker logs "Automation match found" when trigger matches occur.
