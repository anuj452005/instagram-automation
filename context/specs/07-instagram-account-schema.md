# Unit 07: Instagram Account Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define the `instagram_accounts` database table, setting up fields for Meta profile meta-information and AES-encrypted access tokens.

## Why This Unit Exists
To provide relational database structures where linked creators, Facebook Page IDs, and long-lived OAuth tokens can be saved.

## Dependencies
- Unit 04: User Database Schema

## Database Changes
### `instagram_accounts`
- `id`: `varchar(255)`, Primary Key (Instagram Scoped User ID)
- `user_id`: `uuid`, Foreign Key references `users(id)` ON DELETE CASCADE
- `username`: `varchar(255)`, Not Null
- `name`: `varchar(255)`
- `profile_picture_url`: `text`
- `fb_page_id`: `varchar(255)`, Not Null
- `fb_page_access_token`: `text`, Not Null (To store AES-256-GCM encrypted tokens)
- `token_status`: `varchar(50)`, Default `'valid'`, Not Null
- `is_active`: `boolean`, Default `true`, Not Null
- `followers_count`: `integer`, Default `0`
- `connected_at`: `timestamp`, Default `now()`, Not Null
- `last_token_refresh`: `timestamp`
- `created_at`: `timestamp`, Default `now()`, Not Null
- `updated_at`: `timestamp`, Default `now()`, Not Null

*Indexes*: Unique index on `(user_id, id)`.

## File Structure
```
db/
└── schema.ts (Modifies file to add instagramAccounts table)
```

## Success Criteria
- Running `npm run db:generate` produces migration SQL file containing the `instagram_accounts` definition.
- Running `npm run db:migrate` successfully executes the script on PostgreSQL.
