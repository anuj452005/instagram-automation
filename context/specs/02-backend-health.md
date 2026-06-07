# Unit 02: Backend Gateway and Service Health Check

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Establish a running Express.js API gateway with schema validation and a health-check endpoint that checks connection status for PostgreSQL and Redis.

## Why This Unit Exists
To ensure the backend server can boot, load configurations safely, and communicate with database and cache layers before processing user routes.

## Dependencies
- Unit 01: Database Infrastructure and Migrator Setup

## Features Delivered
- Express.js HTTP application scaffolding.
- Zod-based environment variable validation.
- `/health` check HTTP endpoint.

## File Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── redis.ts
│   ├── app.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

## API Contracts
### GET `/health`
- **Method**: `GET`
- **Response Shape**:
  ```json
  {
    "status": "healthy",
    "database": "connected",
    "redis": "connected",
    "timestamp": "2026-06-07T10:00:00Z"
  }
  ```
- **Error Response**: `503 Service Unavailable` if database or Redis is offline.

## Success Criteria
- Accessing `http://localhost:3000/health` returns status `200 OK` with JSON fields confirming database and Redis connections are active.
