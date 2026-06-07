# Unit 17: DM Jobs Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define the `dm_jobs` table to record sending attempts, status, attempts counts, errors, and target recipient details.

## Why This Unit Exists
To provide persistent storage for tracking DMs and ensuring that deduplication constraints (unique index filters) prevent spam.

## Dependencies
- Unit 10: Automations Database Schema

## Database Changes
### `dm_jobs`
- `id`: `uuid`, Primary Key (Default: random)
- `automation_id`: `uuid`, Foreign Key references `automations(id)` ON DELETE CASCADE, Not Null
- `instagram_account_id`: `varchar(255)`, Foreign Key references `instagram_accounts(id)` ON DELETE CASCADE, Not Null
- `recipient_ig_id`: `varchar(100)`, Not Null
- `recipient_username`: `varchar(100)`
- `comment_id`: `varchar(100)`, Not Null
- `comment_text`: `text`
- `keyword_matched`: `varchar(255)`
- `status`: `varchar(50)`, Default `'queued'`, Not Null (queued | sent | failed | skipped | rate_limited)
- `attempts`: `integer`, Default `0`, Not Null
- `last_error`: `text`
- `error_code`: `varchar(100)`
- `bullmq_job_id`: `varchar(255)`
- `queued_at`: `timestamp`, Default `now()`, Not Null
- `sent_at`: `timestamp`
- `failed_at`: `timestamp`
- `created_at`: `timestamp`, Default `now()`, Not Null

*Indexes & Unique constraints*:
- UNIQUE on `(automation_id, recipient_ig_id) WHERE status NOT IN ('failed', 'skipped')` (Prevents duplicate DMs for the same campaign).

## File Structure
```
db/
└── schema.ts (Modifies file to add dmJobs table)
```

## Success Criteria
- Running `npm run db:generate` produces migration SQL files including the `dm_jobs` table.
- Running `npm run db:migrate` successfully modifies PostgreSQL.
