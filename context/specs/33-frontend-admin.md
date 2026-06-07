# Unit 33: Frontend Admin Workspace

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build the system administration dashboard, exposing system-wide MRR, active users counts, queue details, and event logs.

## Why This Unit Exists
To provide system operators and support engineers with a GUI to resolve client issues and monitor platform queues.

## Dependencies
- Unit 06: Frontend Clerk Authentication Integration
- Unit 32: System Administration & Queue Monitor API

## Features Delivered
- Admin dashboard home page (`AdminDashboardPage.tsx`).
- User lookup lists and database status widgets.

## File Structure
```
frontend/src/
└── pages/
    └── AdminDashboardPage.tsx
```

## Success Criteria
- Users with role `admin` can navigate to `/admin` and see system metrics cards and active queue indicators.
- Non-admin users are blocked from loading the route and redirected to the main dashboard.
