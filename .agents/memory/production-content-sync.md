---
name: Production content sync
description: Preserve production business data while publishing approved public CMS changes.
---

For this college site, apply only explicitly approved public-content changes to production. Keep production enquiries and unrelated records intact; do not copy the entire development database as a shortcut.

**Why:** The user chose targeted synchronization after learning that copying development data replaces, rather than merges with, production data.

**How to apply:** Use one-time, narrowly scoped startup migrations for approved site settings, course content, and related public media. Preserve enquiries and other production-only records.
