---
name: Exam updates date-only contract
description: Preserve calendar dates as date-only strings across OpenAPI, generated clients, route validation, and PostgreSQL.
---

Keep exam publication and calendar dates as `YYYY-MM-DD` strings across OpenAPI, generated clients, server routes, and Drizzle `date` columns using string mode. OpenAPI `format: date` causes the current Orval generator to coerce values to JavaScript `Date`, which conflicts with the database string type and can introduce timezone shifts.

**Why:** Date-only fields represent calendar days, not instants. Converting them to JavaScript `Date` caused generated request types to disagree with the database's date-string contract.

**How to apply:** Omit `format: date` for these fields, document the `YYYY-MM-DD` pattern, and validate both syntax and real calendar validity at the API boundary.