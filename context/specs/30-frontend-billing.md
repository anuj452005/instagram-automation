# Unit 30: Frontend Billing & Pricing Plans

## Boundary
Client Boundary (`frontend/src/`)

## Goal
Build a plans selection page, support Razorpay Checkout integrations, and show subscription/billing settings inside the user dashboard.

## Why This Unit Exists
To provide users with pricing tiers, trigger upgrades, and display current subscription quotas.

## Dependencies
- Unit 06: Frontend Clerk Authentication Integration
- Unit 29: Plan Limits Enforcement Middleware

## Features Delivered
- Pricing matrix page (`PricingPage.tsx`).
- Integration of the Razorpay Checkout SDK.
- Settings page displaying remaining monthly DM counts (`BillingSettingsPage.tsx`).

## File Structure
```
frontend/src/
├── hooks/
│   └── useSubscription.ts
└── pages/
    ├── PricingPage.tsx
    └── BillingSettingsPage.tsx
```

## Success Criteria
- Opening `/dashboard/billing` shows the user's active tier, remaining DM counts, and next billing date.
- Selecting a plan triggers the Razorpay popup.
