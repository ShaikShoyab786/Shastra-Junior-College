---
name: CMS media path handling
description: Validate CMS asset uploads and authorize referenced App Storage paths for public serving.
---

CMS media editors persist object paths such as `/objects/uploads/<id>` rather than full URLs. A native `<input type="url">` treats those paths as invalid, so the browser blocks form submission and moves focus back to the media control even when other required fields are present.

**Why:** Browser constraint validation runs before React's submit handler, masking application-level feedback and making valid uploaded assets impossible to save.

**How to apply:** Use a text input for fields accepting App Storage paths, then validate explicitly. Keep image alt text requirements for published images and validate uploaded file type, extension, and size against the server's upload policy.

Public serving uses a reference-based allowlist. When a CMS media field stores its path in section or item content, the storage route must check that reference; otherwise the path can be saved successfully while public asset requests still return 404.

**Why:** An uploaded object is not served merely because it exists; the API also verifies that a supported CMS record references it.

**How to apply:** Whenever a CMS feature adds a media field, allow only its intended upload types and add a narrow storage-route lookup for that field. Save the reference and verify the public endpoint returns the asset.