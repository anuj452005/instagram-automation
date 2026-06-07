# Unit 31: Audit Logs & Admin Database Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define database tables `audit_logs` and `admin_users` to track administrative events and secure system backend logins.

## Why This Unit Exists
To support compliance tracking, recording data modifications, and securing management accounts for administrative portals.

## Dependencies
- Unit 04: User Database Schema

## Database Changes
### `audit_logs`
- `id`: `uuid`, Primary Key (Default: random)
- `user_id`: `uuid` references `users(id)` ON DELETE SET NULL
- `actor_type`: `varchar(50)`, Default `'user'`, Not Null (user | system | admin | worker)
- `action`: `varchar(100)`, Not Null
- `entity_type`: `varchar(100)`
- `entity_id`: `uuid`
- `old_data`: `jsonb`
- `new_data`: `jsonb`
- `ip_address`: `inet`
- `request_id`: `varchar(100)`
- `occurred_at`: `timestamp`, Default `now()`, Not Null

### `admin_users`
- `id`: `uuid`, Primary Key (Default: random)
- `email`: `varchar(255)`, Unique, Not Null
- `password_hash`: `varchar(255)`, Not Null
- `full_name`: `varchar(255)`, Not Null
- `role`: `varchar(50)`, Default `'support'`, Not Null (support | ops | superadmin)
- `is_active`: `boolean`, Default `true`, Not Null
- `created_at`: `timestamp`, Default `now()`, Not Null

*Indexes*:
- Index on `audit_logs(user_id, occurred_at)`.
- Index on `audit_logs(entity_type, entity_id)`.

## File Structure
```
db/
└── schema.ts (Modifies file to add auditLogs and adminUsers tables)
```

## Success Criteria
- Running `npm run db:generate` produces migration files.
- Running `npm run db:migrate` creates both administration tables.
