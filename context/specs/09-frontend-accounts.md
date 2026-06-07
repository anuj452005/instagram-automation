# Unit 09: Frontend Accounts Dashboard

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build the dashboard screen where creators can view connected Instagram profiles and initiate the linking wizard for new accounts.

## Why This Unit Exists
To provide a visual user interface for checking token status and linking Instagram accounts to the workspace.

## Dependencies
- Unit 06: Frontend Clerk Authentication Integration
- Unit 08: Instagram Token Exchange & Linking API

## Features Delivered
- Accounts settings page (`AccountsPage.tsx`).
- Connected page lists with profile metadata cards.
- Activation & disconnection click events.

## File Structure
```
frontend/src/
├── components/
│   └── InstagramAccountCard.tsx
├── hooks/
│   └── useLinkableAccounts.ts
└── pages/
    └── AccountsPage.tsx
```

## Success Criteria
- Opening `/dashboard/accounts` shows all connected profiles.
- Clicking "Link Account" fetches linkable lists from backend, updates connection states, and displays active cards.
