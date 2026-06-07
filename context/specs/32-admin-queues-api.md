# Unit 32: System Administration & Queue Monitor API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Implement administrative statistics endpoints and integrate the Bull Board dashboard under strict authentication controls.

## Why This Unit Exists
To provide administration staff with tools to review system performance, inspect error rates, and retry failed queue jobs manually.

## Dependencies
- Unit 05: Backend Auth Sync Middleware
- Unit 31: Audit Logs & Admin Database Schema

## Features Delivered
- Stats endpoint (`GET /api/admin/stats`).
- Bull Board Express routing setup (`/admin/queues`).
- Administrative authentication check middleware.

## File Structure
```
backend/src/
├── controllers/
│   └── admin.controller.ts
├── routes/
│   └── admin.ts
└── middleware/
    └── adminAuth.middleware.ts
```

## API Contracts
### GET `/api/admin/stats`
- **Response Shape (200 OK)**:
  ```json
  {
    "systemMRR": 50000,
    "totalUsers": 250,
    "systemErrorRate": "0.02%",
    "queueDepths": {
      "comment-ingest": 12,
      "dm-sender": 0
    }
  }
  ```

## Success Criteria
- Accessing `/api/admin/stats` from an account with the role `admin` returns correct totals.
- Accessing administration routes from a standard user account returns `403 Forbidden`.
