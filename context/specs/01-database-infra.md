# Unit 01: Database Infrastructure and Migrator Setup

## Boundary
Persistence Boundary (`db/`)

## Goal
Configure database connection to cloud instances of PostgreSQL and Redis, and initialize the Drizzle database client and schema migration runner for local and production environments.

## Why This Unit Exists
A configured database and migration runner are prerequisites for any data persistence. Setting this up first ensures that all subsequent units can generate and apply schema updates immediately.

## Dependencies
None.

## Features Delivered
- Environment-driven connection configuration for cloud PostgreSQL 16 and Redis 7.
- Drizzle ORM client initialization.
- Schema migrator runner script.

## Database Changes
- None (Initial configuration only).

## File Structure
```
GramFlow/
├── db/
│   ├── migrate.ts
│   └── schema.ts
├── .env.example
└── package.json
```

## Success Criteria
- Environment variables `DATABASE_URL` and `REDIS_URL` are defined in `GramFlow/.env`.
- Running `npm run db:migrate` inside `GramFlow/` successfully executes the migration runner against the cloud database.
- Database client connects to the cloud instance without throwing connection errors.

