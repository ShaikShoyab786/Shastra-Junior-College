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
| `VITE_CLERK_PROXY_URL` | Web build | Absolute HTTPS URL for the site's same-origin Clerk proxy, e.g. `https://your-domain.example/api/__clerk`. |
| `R2_ACCOUNT_ID` | API | Cloudflare account ID for the R2 S3 endpoint. |
| `R2_ACCESS_KEY_ID` | API | R2 S3 access key ID. |
| `R2_SECRET_ACCESS_KEY` | API | R2 S3 secret access key; keep private. |
| `R2_BUCKET_NAME` | API | Existing R2 bucket name. |
| `R2_PUBLIC_PREFIX` | API | Optional public object prefix; defaults to `public`. |
| `R2_PRIVATE_PREFIX` | API | Optional private upload prefix; defaults to `private`. |

Do not commit real values to this repository or send secret values in chat.
Mark `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PROXY_URL` as build-time
variables. Set the proxy URL to the final public HTTPS domain assigned to the
`web` service. Keep database, Clerk secret, and R2 credentials runtime-only.

## Data and storage prerequisites

- The PostgreSQL resource created in Coolify is empty. Before switching traffic,
  take a backup of the current production database, restore it into Coolify, and
  verify the restored data. Do not use the development database as a replacement
  for production data.
- Keep PostgreSQL private. Configure persistent storage and an off-server backup
  destination before relying on it for production.
- The API uses Cloudflare R2 when `STORAGE_PROVIDER=r2`, while retaining the
  Replit sidecar path for the Replit deployment. Configure R2 bucket CORS to
  allow browser `PUT` requests from the production website origin, with the
  `Content-Type` request header.
- Existing Replit media still needs to be copied into the R2 bucket before
  cutover. Private objects must retain the `uploads/<uuid>` suffix under the
  configured private prefix so database values such as `/objects/uploads/<uuid>`
  continue to resolve.
- To copy existing media, add the same R2 credentials to Replit Secrets
  temporarily (never commit them), run the migration script from the Replit
  workspace first without arguments to review the count, then run it with
  `--execute`. The script skips destination keys that already exist and does not
  alter the Replit source objects or database.
- The API initializes seed content at startup, but the database schema must
  already exist. Restore a complete database dump including its schema, or run
  the reviewed Drizzle schema setup against the empty target database before
  starting the API.

## Local build checks

The web image expects `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CLERK_PROXY_URL` at
build time. The API image expects a reachable `DATABASE_URL` and production
Clerk variables at runtime.
