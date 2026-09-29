---
name: Page-scoped CMS seeding
description: Idempotency constraints when moving legacy CMS content between page slugs.
---

When a default CMS section moves from Home to a dedicated page, update the original startup seeder's missing-section fallback to recognize the new page location. Otherwise every restart can recreate the legacy section, and its migration can re-import duplicate rows. Do not set a migration-complete marker in newly created section content before the data migration has actually finished.

**Why:** Startup seeding and the page migration are separate code paths. A migration can appear correct on its first run yet duplicate records after a restart, or skip required initial data if its marker is written too early.

**How to apply:** For page-slug migrations, trace both the migration and original default-content seed path, use add-only version markers, and verify row counts across at least two API restarts.