# Unit 27: Billing Database Columns

## Boundary
Persistence Boundary (`db/`)

## Goal
Add columns to the `users` table to track subscription status, Razorpay customer IDs, expiration datetimes, and monthly DM usage quotas.

## Why This Unit Exists
To support billing workflows, keeping records of plan limitations and subscription expiration states in PostgreSQL.

## Dependencies
- Unit 04: User Database Schema

## Database Changes
### `users` (Modifications)
- Add column `subscription_id`: `varchar(255)`
- Add column `razorpay_customer_id`: `varchar(255)`
- Add column `subscription_ends_at`: `timestamp`
- Add column `dm_count_reset_at`: `timestamp`

## File Structure
```
db/
└── schema.ts (Modifies file to append columns to users table)
```

## Success Criteria
- Running `npm run db:generate` produces migration files updating the `users` table.
- Running `npm run db:migrate` successfully updates the table structure.
