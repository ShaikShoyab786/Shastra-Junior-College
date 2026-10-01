---
name: CMS image path handling
description: Validate relative App Storage paths and authorize CMS image references for public serving.
---

CMS media editors persist object paths such as `/objects/uploads/<id>` rather than full URLs. A native `<input type="url">` treats those paths as invalid, so the browser blocks form submission and moves focus back to the image control even when alt text is present.

**Why:** Browser constraint validation runs before React's submit handler, masking application-level feedback and making valid uploaded assets impossible to save.

**How to apply:** Use a text input for fields accepting App Storage paths, then validate explicitly: allow safe same-site paths or HTTP(S) URLs, and still require useful alt text for published images.

Public serving uses a reference-based allowlist. When a CMS image field stores its path in `content_sections.content.imageUrl`, the storage route must check that reference; otherwise the path can be saved successfully while public image requests still return 404.

**Why:** An uploaded object is not served merely because it exists; the API also verifies that a supported CMS record references it.

**How to apply:** Whenever a CMS feature adds an image field, update the storage route's reference lookup for that field and verify its public endpoint returns the image.