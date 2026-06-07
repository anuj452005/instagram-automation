# Unit 24: Analytics Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define database tables `analytics_events` and `analytics_snapshots` to record raw user interaction events and maintain daily aggregates.

## Why This Unit Exists
To support dashboard performance, avoiding expensive queries on large tables by pre-aggregating counts on a daily basis.

## Dependencies
- Unit 19: Leads Database Schema

## Database Changes
### `analytics_events`
- `id`: `uuid`, Primary Key (Default: random)
- `instagram_account_id`: `varchar(255)`, Not Null
- `automation_id`: `uuid` references `automations(id)` ON DELETE SET NULL
- `event_type`: `varchar(50)`, Not Null (comment_received | keyword_matched | dm_sent | dm_failed | lead_collected)
- `payload`: `jsonb`
- `created_at`: `timestamp`, Default `now()`, Not Null

### `analytics_snapshots`
- `id`: `uuid`, Primary Key (Default: random)
- `instagram_account_id`: `varchar(255)`, Foreign Key references `instagram_accounts(id)` ON DELETE CASCADE, Not Null
- `automation_id`: `uuid` references `automations(id)` ON DELETE CASCADE, Not Null
- `date`: `date`, Not Null
- `comments_count`: `integer`, Default `0`, Not Null
- `keywords_matched`: `integer`, Default `0`, Not Null
- `dms_sent`: `integer`, Default `0`, Not Null
- `failures_count`: `integer`, Default `0`, Not Null
- `leads_collected`: `integer`, Default `0`, Not Null

*Indexes & Unique constraints*:
- UNIQUE index on `(instagram_account_id, automation_id, date)` on `analytics_snapshots`.
- Index on `analytics_events(instagram_account_id, created_at)`.

## File Structure
```
db/
└── schema.ts (Modifies file to add analytics tables)
```

## Success Criteria
- Running `npm run db:generate` produces migration files.
- Running `npm run db:migrate` creates both analytics tables.
