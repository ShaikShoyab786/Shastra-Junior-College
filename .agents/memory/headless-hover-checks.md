---
name: Headless hover checks
description: Chromium preview behavior when validating pointer hover styles.
---

The Replit headless Chromium preview can report `matchMedia("(hover: hover)") === false` while CDP mouse movement still makes an element match `:hover`. Tailwind hover utilities remain inactive because its generated rules are gated by the hover-capability media query.

**Why:** A synthetic mouse event alone did not activate the production hover colors, while focus-visible and reduced-motion styles could be checked normally.

**How to apply:** When hover styling appears inactive in headless verification, distinguish unsupported hover hardware emulation from a missing CSS rule; inspect the built CSS or use a hover-capable browser before changing the interaction styles.