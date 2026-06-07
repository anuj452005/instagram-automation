# Unit 12: Frontend Automation Builder

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build the web dashboard where creators can configure, view, customize, and save trigger-keyword campaigns.

## Why This Unit Exists
To provide creators with a visual interface to manage campaigns, add trigger keywords, and draft DM responses.

## Dependencies
- Unit 09: Frontend Accounts Dashboard
- Unit 11: Automations CRUD API

## Features Delivered
- Campaigns overview dashboard listing active/draft rules.
- Interactive creation flow screen (`AutomationBuilderPage.tsx`).
- Tag editors for managing keywords, selections for post targeting, and DM template fields.

## File Structure
```
frontend/src/
├── hooks/
│   └── useAutomations.ts
└── pages/
    ├── AutomationsListPage.tsx
    └── AutomationBuilderPage.tsx
```

## Success Criteria
- Creators can click "Create Campaign", enter details, select an Instagram profile, and click save.
- Saving updates lists instantly and triggers saving animations without page-reload halts.
