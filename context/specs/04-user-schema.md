# Unit 04: User Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define the `users` table schema with all columns required for Clerk references, roles, subscriptions, and timestamps.

## Why This Unit Exists
Establishing the user schema is essential for creating the user synchronization mechanisms and tracking authentication states in the database.

## Dependencies
- Unit 01: Database Infrastructure and Migrator Setup

## Database Changes
### `users`
- `id`: `uuid`, Primary Key (Default: random)
- `clerk_user_id`: `varchar(255)`, Unique, Not Null
- `name`: `varchar(255)`, Not Null
- `email`: `varchar(255)`, Not Null
- `role`: `varchar(50)`, Default `'user'`, Not Null
- `subscription_tier`: `varchar(50)`, Default `'free'`, Not Null
- `subscription_status`: `varchar(50)`, Default `'active'`, Not Null
- `monthly_dm_count`: `integer`, Default `0`, Not Null
- `created_at`: `timestamp`, Default `now()`, Not Null
- `updated_at`: `timestamp`, Default `now()`, Not Null

## File Structure
```
db/
└── schema.ts (Modifies file to add users table)
```

## Success Criteria
- Running `npm run db:generate` produces a migration SQL file containing the `users` table creation script.
- Running `npm run db:migrate` successfully executes the migration on PostgreSQL.
