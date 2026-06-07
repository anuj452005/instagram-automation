# Unit 19: Leads Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define the `leads` table to store captured user emails, phone numbers, and source campaign references.

## Why This Unit Exists
To provide persistent database storage for lead acquisition events.

## Dependencies
- Unit 17: DM Jobs Database Schema

## Database Changes
### `leads`
- `id`: `uuid`, Primary Key (Default: random)
- `automation_id`: `uuid`, Foreign Key references `automations(id)` ON DELETE SET NULL, Not Null
- `instagram_account_id`: `varchar(255)`, Not Null
- `ig_user_id`: `varchar(100)`, Not Null
- `ig_username`: `varchar(100)`
- `email`: `varchar(255)`
- `phone`: `varchar(50)`
- `full_name`: `varchar(255)`
- `source_comment`: `text`
- `source_dm_job_id`: `uuid` references `dm_jobs(id)` ON DELETE SET NULL
- `captured_at`: `timestamp`, Default `now()`, Not Null
- `created_at`: `timestamp`, Default `now()`, Not Null
- `updated_at`: `timestamp`, Default `now()`, Not Null

*Indexes & Unique constraints*:
- UNIQUE on `(automation_id, ig_user_id)` (Deduplicates leads per campaign).

## File Structure
```
db/
└── schema.ts (Modifies file to add leads table)
```

## Success Criteria
- Running `npm run db:generate` produces migration files.
- Running `npm run db:migrate` creates the `leads` table on PostgreSQL.
