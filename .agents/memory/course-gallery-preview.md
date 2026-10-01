---
name: Course gallery preview
description: Selection and visibility rules for Gallery images reused on course detail pages.
---

A per-image `showOnCoursePreview` toggle in Gallery settings controls whether a published gallery image appears on every course detail page. Keep it independent from `showOnHome`; order selected images by their existing Gallery position. Do not add faculty eligibility, subject matching, or per-course image selection. Gallery and Faculty Preview copy can be customized per course.

**Why:** The user confirmed a single global checkbox should control all course pages and that gallery selection does not need the Faculty eligibility rules. Course-specific preview copy belongs in the course settings, so it reuses the existing per-course content-save path instead of adding new section records or API/schema changes.

**How to apply:** Keep Gallery settings as the source of image selection, require normal public visibility, omit the Gallery preview when nothing is selected, and keep per-course preview copy in the existing course content. Reuse the college's theme and Gallery copy as defaults.