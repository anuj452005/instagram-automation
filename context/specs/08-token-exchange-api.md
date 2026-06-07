# Unit 08: Instagram Token Exchange & Linking API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Implement endpoints that fetch connected Facebook Pages, exchange user tokens for long-lived Page Access Tokens via the Meta Graph API, and securely save them.

## Why This Unit Exists
To establish access and permissions to target Instagram Creator accounts, enabling webhook subscriptions and message dispatch capabilities.

## Dependencies
- Unit 05: Backend Auth Sync Middleware
- Unit 07: Instagram Account Database Schema

## Features Delivered
- AES-256-GCM token encryption and decryption services.
- Meta Graph API client configurations.
- `/api/accounts/linkable` and `/api/accounts/activate` API handlers.

## File Structure
```
backend/src/
├── controllers/
│   └── accounts.controller.ts
├── routes/
│   └── accounts.ts
└── services/
    ├── encryption.service.ts
    └── meta.service.ts
```

## API Contracts
### GET `/api/accounts/linkable`
- **Headers**: `Authorization: Bearer <clerk_jwt>`
- **Response Shape (200 OK)**:
  ```json
  [
    {
      "instagramAccountId": "ig_123",
      "username": "creator_handle",
      "name": "Creator Name",
      "profilePictureUrl": "https://...",
      "fbPageId": "page_456"
    }
  ]
  ```

### POST `/api/accounts/activate`
- **Request Body**:
  ```json
  {
    "instagramAccountId": "ig_123",
    "fbPageId": "page_456"
  }
  ```
- **Response Shape (200 OK)**:
  ```json
  {
    "id": "ig_123",
    "username": "creator_handle",
    "isActive": true
  }
  ```

## Success Criteria
- Mocking a Meta Graph API response for page listing returns a structured payload.
- Sending a POST request to `/api/accounts/activate` updates PostgreSQL with an AES-encrypted page access token.
