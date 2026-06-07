# Unit 11: Automations CRUD API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Implement secure HTTP routes for creators to create, read, update, and delete (CRUD) automation rules and associated trigger keywords.

## Why This Unit Exists
To provide back-end endpoints that validate payload integrity and enforce owner tenancy scopes before modifying automation rules.

## Dependencies
- Unit 08: Instagram Token Exchange & Linking API
- Unit 10: Automations Database Schema

## Features Delivered
- Tenant-isolated routes for automation CRUD operations.
- Zod validation for triggers, keywords, and DM templates.
- Endpoints: `POST /api/automations`, `GET /api/automations`, `GET /api/automations/:id`, `PUT /api/automations/:id`, `DELETE /api/automations/:id`.

## File Structure
```
backend/src/
├── controllers/
│   └── automations.controller.ts
├── routes/
│   └── automations.ts
└── services/
    └── automations.service.ts
```

## API Contracts
### POST `/api/automations`
- **Request Body**:
  ```json
  {
    "instagramAccountId": "ig_123",
    "name": "Ebook Campaign",
    "flowType": "dm",
    "dmTemplate": "Here is your ebook download: https://...",
    "keywords": [
      { "keyword": "ebook", "matchType": "exact" }
    ]
  }
  ```
- **Response Shape (201 Created)**:
  ```json
  {
    "id": "uuid-string",
    "instagramAccountId": "ig_123",
    "name": "Ebook Campaign",
    "status": "draft"
  }
  ```

## Success Criteria
- Requesting `GET /api/automations` returns only the automations owned by the authenticated tenant user.
- Invalid payloads (e.g. empty keyword list or missing template) return `422 Unprocessable Entity` validation responses.
