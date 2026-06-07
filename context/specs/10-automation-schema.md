# Unit 10: Automations Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define database tables `automations` and `automation_keywords` with all required foreign keys, matching modes, status states, and index scopes.

## Why This Unit Exists
To support persistence for automation campaigns, matching keywords, and DM templates.

## Dependencies
- Unit 07: Instagram Account Database Schema

## Database Changes
### `automations`
- `id`: `uuid`, Primary Key (Default: random)
- `instagram_account_id`: `varchar(255)`, Foreign Key references `instagram_accounts(id)` ON DELETE CASCADE, Not Null
- `name`: `varchar(255)`, Not Null
- `status`: `varchar(50)`, Default `'draft'`, Not Null (draft | active | paused | archived)
- `post_id`: `varchar(255)`, Nullable (null = global trigger)
- `post_url`: `text`
- `post_type`: `varchar(20)` (FEED | REEL | STORY)
- `flow_type`: `varchar(50)`, Not Null (dm | landing_page)
- `dm_template`: `text`, Not Null
- `collect_leads`: `boolean`, Default `false`, Not Null
- `lead_fields`: `jsonb`, Default `['email']`
- `landing_page_token`: `varchar(100)`
- `also_reply_comment`: `boolean`, Default `false`, Not Null
- `comment_reply_text`: `text`
- `scheduled_activate_at`: `timestamp`
- `created_at`: `timestamp`, Default `now()`, Not Null
- `updated_at`: `timestamp`, Default `now()`, Not Null

### `automation_keywords`
- `id`: `uuid`, Primary Key (Default: random)
- `automation_id`: `uuid`, Foreign Key references `automations(id)` ON DELETE CASCADE, Not Null
- `keyword`: `varchar(255)`, Not Null
- `match_type`: `varchar(50)`, Default `'exact'`, Not Null (exact | contains | starts_with)
- `created_at`: `timestamp`, Default `now()`, Not Null

*Indexes*:
- Index on `automations(instagram_account_id)`
- Index on `automation_keywords(automation_id)`

## File Structure
```
db/
└── schema.ts (Modifies file to add automations and keywords tables)
```

## Success Criteria
- Running `npm run db:generate` produces correct migration SQL scripts.
- Running `npm run db:migrate` successfully inserts the schemas and updates PostgreSQL constraints.
