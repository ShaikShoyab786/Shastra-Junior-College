---
name: Page-scoped CMS seeding
description: Idempotency constraints for CMS startup seeding, section moves, and durable admin deletion.
---

When a default CMS section moves from Home to a dedicated page, update the original startup seeder's missing-section fallback to recognize the new page location. Otherwise every restart can recreate the legacy section, and its migration can re-import duplicate rows. Do not set a migration-complete marker in newly created section content before the data migration has actually finished.

For optional CMS sections that staff can permanently delete, use a one-time seed marker stored outside the section. An unconditional create-if-missing check on every startup will undo the deletion.

**Why:** Startup seeding and the page migration are separate code paths. A migration can appear correct on its first run yet duplicate records after a restart, or skip required initial data if its marker is written too early.

**How to apply:** For page-slug migrations, trace both the migration and original default-content seed path. For optional sections, persist the one-time marker in a section that is not user-deletable; verify initial seeding and confirm later restarts do not restore an intentionally deleted section.