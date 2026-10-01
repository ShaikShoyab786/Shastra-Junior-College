---
name: Page-scoped CMS seeding
description: Idempotency constraints for CMS startup seeding, section moves, and durable admin deletion.
---

When a default CMS section moves from Home to a dedicated page, update the original startup seeder's missing-section fallback to recognize the new page location. Otherwise every restart can recreate the legacy section, and its migration can re-import duplicate rows. Do not set a migration-complete marker in newly created section content before the data migration has actually finished.

For default item collections inside a permanent CMS section, seed starter items only when creating the section; an existing empty section means staff intentionally removed its items. If staff can permanently delete the section itself, use a one-time seed marker stored outside the section.

For a deliberate starter-content expansion to an existing permanent section, use a one-time version marker in section content and preserve unknown content keys in every editor. The insertion and marker update should be atomic so later restarts neither duplicate additions nor restore items staff delete.

For individual course-detail content that shares the existing Courses CMS API, keep each course's sections under the `courses` page namespace and prefix section keys by course. Item writes remain isolated through their section IDs, while the overview can continue selecting only its own known section keys.

Shared FAQ items use the Home FAQ section as their storage source. About and Contact have their own FAQ heading sections, so hiding the Home heading must not suppress visible items targeted to those pages.

**Why:** Startup seeding and page migrations are separate code paths. Unconditional create-if-missing checks can undo staff deletions, while non-atomic or editor-lost markers can duplicate a deliberate one-time content expansion after restart.

Sharing the existing Courses namespace also avoids adding page-slug allowlists for course detail data, while course-prefixed sections keep the overview's render selection unchanged.

**How to apply:** For page-slug migrations, trace both the migration and original default-content seed path. For fixed sections with editable starter items, create defaults alongside first section creation and verify a later restart does not restore deleted items. For intentional additions to an existing permanent section, persist an atomic version marker in a content object that every section editor preserves; verify repeated startups do not duplicate content or restore deletions. For optional sections, store the one-time marker outside any user-deletable section. For course detail data, use course-prefixed sections in the existing Courses page unless a future feature requires separate CMS page loading. For shared FAQs, fetch the shared rows independently of the Home heading's visibility when rendering pages with their own FAQ sections, and filter by each page's target.