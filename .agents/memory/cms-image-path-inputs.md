---
name: CMS image path inputs
description: Avoid native URL validation for App Storage object paths in CMS editors.
---

CMS media editors persist object paths such as `/objects/uploads/<id>` rather than full URLs. A native `<input type="url">` treats those paths as invalid, so the browser blocks form submission and moves focus back to the image control even when alt text is present.

**Why:** Browser constraint validation runs before React's submit handler, masking application-level feedback and making valid uploaded assets impossible to save.

**How to apply:** Use a text input for fields accepting App Storage paths, then validate explicitly: allow safe same-site paths or HTTP(S) URLs, and still require useful alt text for published images.