# Coolify deployment

This Compose stack runs the Shastra College frontend and API as separate
containers. Nginx serves the Vite build and forwards `/api/*` requests to the
private API container. PostgreSQL remains a separate Coolify database resource.

## Coolify setup

1. Add this repository as a Docker Compose resource in the `Shastra Junior
   College` project and select `deploy/coolify/compose.yaml` as the Compose file.
2. Select the existing `localhost` server only if the team has approved using
   that shared host.
3. Add the environment variables below as Coolify variables. Keep the PostgreSQL
   resource private and use its internal connection URL for `DATABASE_URL`.
4. Assign the public website domain to the `web` service on port `80`. Do not
   assign a public domain or host port to `api`.
5. Deploy only after the production database has been backed up and its schema
   and data are ready. Keep the current Replit database available for rollback.

## Required Coolify variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | API | Internal PostgreSQL connection URL from Coolify. |
| `CLERK_PUBLISHABLE_KEY` | API | Production Clerk publishable key. |
| `CLERK_SECRET_KEY` | API | Production Clerk secret key; keep private. |
| `ADMIN_USER_IDS` | API | Comma-separated production Clerk user IDs. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Web build | Production Clerk publishable key; this is embedded in the frontend build. |

Do not commit real values to this repository or send secret values in chat.

## Data and storage prerequisites

- The PostgreSQL resource created in Coolify is empty. Before switching traffic,
  take a backup of the current production database, restore it into Coolify, and
  verify the restored data. Do not use the development database as a replacement
  for production data.
- Keep PostgreSQL private. Configure persistent storage and an off-server backup
  destination before relying on it for production.
- The current upload/storage adapter uses Replit's local sidecar for Google
  Cloud Storage credentials and signed upload URLs. It will need a portable
  storage configuration and an authorized external bucket before uploads and
  existing stored media can work outside Replit. Do not cut over until that
  storage migration has been planned and tested.
- The API initializes seed content at startup, but the database schema must
  already exist. Restore a complete database dump including its schema, or run
  the reviewed Drizzle schema setup against the empty target database before
  starting the API.

## Local build checks

The web image expects `VITE_CLERK_PUBLISHABLE_KEY` at build time. The API image
expects a reachable `DATABASE_URL` and production Clerk variables at runtime.
