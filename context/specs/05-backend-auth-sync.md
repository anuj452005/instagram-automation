# Unit 05: Backend Auth Sync Middleware

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Integrate Clerk Express middleware to verify JWT signatures and write a `syncUser` middleware to automatically synchronize authenticated users into the database.

## Why This Unit Exists
To secure backend routes and guarantee that every API call from an authenticated client has access to a corresponding, synced PostgreSQL user record.

## Dependencies
- Unit 02: Backend Gateway and Service Health Check
- Unit 04: User Database Schema

## Features Delivered
- Express verification of Clerk RS256 JWT tokens.
- On-demand user synchronization middleware (`syncUser`).
- `/api/auth/me` protected endpoint returning current user profile.

## File Structure
```
backend/src/
├── middleware/
│   ├── auth.middleware.ts
│   └── syncUser.middleware.ts
└── routes/
    └── auth.ts
```

## API Contracts
### GET `/api/auth/me`
- **Headers**: `Authorization: Bearer <clerk_jwt>`
- **Response Shape (200 OK)**:
  ```json
  {
    "id": "uuid-string",
    "clerkUserId": "user_123",
    "name": "Creator Name",
    "email": "creator@domain.com",
    "subscriptionTier": "free",
    "subscriptionStatus": "active"
  }
  ```
- **Error Response**: `401 Unauthorized` if token is missing or invalid.

## Success Criteria
- Simulating a requests with a valid Clerk JWT returns a synced database profile response.
- Requests without a token or with an invalid token are blocked with `401`.
