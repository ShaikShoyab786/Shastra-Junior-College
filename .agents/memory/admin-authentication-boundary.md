---
name: Admin authentication boundary
description: The Coolify admin workspace uses a shared password session rather than Clerk user-ID allowlisting.
---

For the Coolify deployment, admin access is handled by a password-protected, signed HTTP-only session cookie. Keep this separate from the public site's Clerk sign-in routes unless the user explicitly requests a full Clerk removal.

**Why:** The user chose a simpler admin login after Clerk sign-in repeatedly returned 403, while requiring existing production data to remain untouched.

**How to apply:** Do not reset or migrate PostgreSQL or R2 for admin-auth changes. Keep admin credentials and session-signing secrets in Coolify runtime variables, never frontend build variables or source code.
