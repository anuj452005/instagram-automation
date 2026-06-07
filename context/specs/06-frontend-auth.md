# Unit 06: Frontend Clerk Authentication Integration

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Integrate the Clerk React SDK into the frontend, enforce login flows via Facebook connection, and configure routing layers for protected routes.

## Why This Unit Exists
To provide creators with login controls, retrieve identity tokens, and secure internal pages from unauthenticated visits.

## Dependencies
- Unit 03: Frontend Skeleton and Theme Integration
- Unit 05: Backend Auth Sync Middleware

## Features Delivered
- Clerk React Provider integration.
- Navigation bar layout with login, registration, and user profile widgets.
- Authenticated route guards.

## File Structure
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx
│   └── DashboardLayout.tsx
├── lib/
│   └── clerk.ts
└── App.tsx (Modifies routing configuration)
```

## Success Criteria
- Navigating to `/dashboard` redirects anonymous users to `/login`.
- Authenticating successfully on `/login` redirects the user back to `/dashboard` and displays the user's name.
