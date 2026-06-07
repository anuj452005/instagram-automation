# Unit 13: Webhook Logging Schema

## Boundary
Persistence Boundary (`db/`)

## Goal
Define the `webhook_events` database schema for storing raw Meta webhook events and tracking their parsing states.

## Why This Unit Exists
To ensure an audit trail of incoming comments is persisted before enqueuing, facilitating debugging and replay capabilities if outages occur.

## Dependencies
- Unit 10: Automations Database Schema

## Database Changes
### `webhook_events`
- `id`: `uuid`, Primary Key (Default: random)
- `ig_user_id`: `varchar(100)`, Not Null
- `event_type`: `varchar(100)`, Not Null
- `raw_payload`: `jsonb`, Not Null
- `processed`: `boolean`, Default `false`, Not Null
- `skippable`: `boolean`, Default `false`, Not Null
- `processing_error`: `text`
- `received_at`: `timestamp`, Default `now()`, Not Null
- `processed_at`: `timestamp`

*Indexes*: Index on `(processed, received_at) WHERE processed = false AND skippable = false`.

## File Structure
```
db/
└── schema.ts (Modifies file to add webhookEvents table)
```

## Success Criteria
- Running `npm run db:generate` produces migration SQL containing the `webhook_events` schema.
- Running `npm run db:migrate` successfully creates the table.
