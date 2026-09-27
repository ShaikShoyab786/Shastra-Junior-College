# Shastra Junior College

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the API
- `pnpm --filter @workspace/shastra-college run typecheck` — typecheck the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; provisioned for this project by Replit.
- Admin setup: add `ADMIN_USER_IDS` in Replit Secrets with authorized Clerk user IDs, comma-separated. Signed-in users are not admins unless listed.
- Clerk's `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` are provisioned through Replit-managed Clerk Auth.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: Vite for the web app; esbuild ESM bundle for the API
- Authentication: Replit-managed Clerk, with server-side `ADMIN_USER_IDS` authorization for CMS routes
- Shastra web pins React and React DOM 19.1.4 locally for Clerk compatibility; the root catalog remains at 19.1.0 for Expo.

## Where things live

- `artifacts/shastra-college` — public React/Vite site and `/admin` editor
- `artifacts/api-server/src/routes/home.ts` — public homepage reads and protected CMS endpoints
- `lib/db/src/schema/cms.ts` — site settings, page sections, and repeatable content items
- `lib/api-spec/openapi.yaml` — API source of truth; regenerate clients after changes

## Architecture decisions

- One shared settings row stores the college name, logo path, navigation, and footer copy.
- Sections and items are reusable across page slugs, but this milestone exposes homepage editing only.
- Public reads omit hidden sections and items; admin reads include them.
- Admin access is deny-by-default; configure the Clerk user ID allowlist before editing content.

## Product

The public homepage uses the supplied college logo and clearly marked demo copy for logo-confirmed preparation labels. Staff can sign in to manage homepage sections, repeatable items, visibility, order, images, and shared site settings. Other planned public pages are not implemented yet.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
