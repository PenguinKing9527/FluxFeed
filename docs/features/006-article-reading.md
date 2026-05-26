# 006 Article Reading

## Requirement

Articles support two reading modes:

- Internal reading view.
- Open original article in a new browser tab.

## Internal Reading View

The internal view should be immersive and optimized for reading:

- Render title, feed name, author, publication time, and content.
- Show article tags in the reading view footer and allow manual tag changes.
- Sanitize feed HTML before rendering.
- Lazy-load images.
- Rewrite links to open externally with safe `rel` attributes.
- Style code blocks and preformatted text.
- Preserve readable typography and spacing.

## Original Article

Opening the original article should create a new tab with the article URL. This
is triggered from toolbar actions, keyboard shortcuts, and article controls.

## List Behavior

Article list supports:

- All articles.
- Unread only.
- Newest first and oldest first.
- Group/feed scoped views.
- Virtual scrolling for large lists.

## Acceptance Criteria

- Unsafe HTML cannot execute script in the reader.
- Images do not block initial reader rendering.
- Links open outside the extension document.
- List sorting and filters compose correctly.
