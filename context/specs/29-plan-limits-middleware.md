# Unit 29: Plan Limits Enforcement Middleware

## Boundary
API Interface Boundary (`backend/src/routes/` & `controllers/` / middleware)

## Goal
Implement a `checkPlanLimits` middleware to intercept API requests and prevent users from exceeding their active account, campaign, and monthly DM quotas.

## Why This Unit Exists
To enforce subscription tiers, preventing users from exceeding resource limits.

## Dependencies
- Unit 28: Razorpay Webhooks and Checkout API

## Features Delivered
- `checkPlanLimits` request interceptor middleware.
- Error code definitions for billing exceptions.

## File Structure
```
backend/src/
└── middleware/
    └── checkPlanLimits.middleware.ts
```

## Success Criteria
- Requesting `/api/automations` with 3 active automations on the Starter tier blocks the save request with a `402 Payment Required` error.
- Message processors drop outgoing DMs if a tenant's monthly DM quota is exceeded.
