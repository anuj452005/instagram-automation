# Unit 21: Landing Page Submission API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Implement a public submission endpoint for mobile-responsive landing pages, facilitating lead capture for users who opt out of native DM flows.

## Why This Unit Exists
To provide a web form fallback route for collecting follower details outside of the direct message interface.

## Dependencies
- Unit 19: Leads Database Schema

## Features Delivered
- `/api/public/leads/submit` public HTTP POST route.
- Parameter checks verifying request tokens and active campaign scopes.

## File Structure
```
backend/src/
├── controllers/
│   └── public-leads.controller.ts
└── routes/
    └── public-leads.ts
```

## API Contracts
### POST `/api/public/leads/submit`
- **Request Body**:
  ```json
  {
    "landingPageToken": "campaign-token",
    "email": "follower@email.com",
    "phone": "+919999999999",
    "fullName": "Follower Name"
  }
  ```
- **Response Shape (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lead captured successfully"
  }
  ```

## Success Criteria
- Sending a valid payload to `/api/public/leads/submit` creates a row in the `leads` table.
- Submissions with missing or invalid fields return `422 Unprocessable Entity` validation responses.
