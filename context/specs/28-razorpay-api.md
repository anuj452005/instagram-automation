# Unit 28: Razorpay Webhooks and Checkout API

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/`)

## Goal
Integrate the Razorpay SDK to handle subscription session setups, verify Razorpay signature webhooks, and process transaction events.

## Why This Unit Exists
To monetize the SaaS with UPI/card recurring payments, ensuring that user tiers are automatically updated when payments succeed or fail.

## Dependencies
- Unit 05: Backend Auth Sync Middleware
- Unit 27: Billing Database Columns

## Features Delivered
- Razorpay checkout endpoint (`POST /api/billing/create-subscription`).
- Webhook signature validation handler (`POST /api/billing/webhook`).
- Auto-renew and cancellation handlers.

## File Structure
```
backend/src/
├── controllers/
│   └── billing.controller.ts
├── routes/
│   └── billing.ts
└── services/
    └── razorpay.service.ts
```

## API Contracts
### POST `/api/billing/create-subscription`
- **Request Body**:
  ```json
  {
    "planId": "plan_starter"
  }
  ```
- **Response Shape (200 OK)**:
  ```json
  {
    "subscriptionId": "sub_xyz",
    "razorpayKey": "rzp_test_..."
  }
  ```

### POST `/api/billing/webhook`
- **Headers**: `x-razorpay-signature`
- **Request Body**: Raw Razorpay event payload.
- **Response**: `200 OK`.

## Success Criteria
- Posting mock events (e.g. `subscription.charged`) to the webhook endpoint updates the target user's status to `active` in PostgreSQL.
- Invalid webhook signatures return `400 Bad Request` or `403 Forbidden`.
