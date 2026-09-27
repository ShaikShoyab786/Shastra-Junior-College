---
name: Vite dependency pre-bundles
description: React runtime version mismatches caused by stale optimized dependency bundles after workspace package updates.
---

When React's installed versions match but the browser reports a version mismatch, Vite may still be serving an optimized dependency bundle from before the package update. Rebuild the artifact's generated Vite cache and restart its workflow before changing package versions again.

**Why:** The package tree and typecheck showed matching versions, but the browser still loaded React 19.1.0 from Vite's previous prebundle after the workspace had moved to React 19.1.4.

**How to apply:** Check the actual browser error and the optimized dependency bundle when installed packages and runtime behavior disagree. Refresh the Vite cache, restart, then verify in the browser.