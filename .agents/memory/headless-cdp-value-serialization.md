---
name: Headless CDP value serialization
description: Avoid value-serialization failures when inspecting Chromium pages through the Chrome DevTools Protocol.
---

When using `Runtime.evaluate` with `returnByValue: true`, return primitives or plain JSON objects. Returning a DOM node directly (for example, the result of `document.querySelector`) can fail with “Object reference chain is too long.” Coerce selectors to booleans for wait conditions, and map DOM nodes to only the primitive properties needed for assertions.

Fresh app-preview captures may start with clean browser storage. If a site has a session-gated intro overlay, each new capture can replay it and obscure the deep route being checked. Set the session state before navigation in the same CDP browser context rather than changing the app's intro behavior just for the screenshot.

**Why:** Headless browser checks can fail on raw-element serialization, and fresh preview contexts may not retain session state between captures.

**How to apply:** Keep CDP polling expressions serializable and small, especially when a `waitFor` helper evaluates them repeatedly. For session-dependent pages, preload the expected session state before navigating in the same context.