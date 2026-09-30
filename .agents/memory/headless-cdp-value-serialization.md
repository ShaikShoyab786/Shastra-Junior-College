---
name: Headless CDP value serialization
description: Avoid value-serialization failures when inspecting Chromium pages through the Chrome DevTools Protocol.
---

When using `Runtime.evaluate` with `returnByValue: true`, return primitives or plain JSON objects. Returning a DOM node directly (for example, the result of `document.querySelector`) can fail with “Object reference chain is too long.” Coerce selectors to booleans for wait conditions, and map DOM nodes to only the primitive properties needed for assertions.

**Why:** A headless browser check failed while serializing a raw element; returning a boolean and explicit image properties worked.

**How to apply:** Keep CDP polling expressions serializable and small, especially when a `waitFor` helper evaluates the expression repeatedly.