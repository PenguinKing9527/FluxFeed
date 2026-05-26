# FluxFeed Project Plan

## Goal

Build FluxFeed as a local-first browser extension RSS reader. The extension
should make subscription easy from the current page, then provide a full reading
workspace in the options page with grouping, local search, reading state,
favorites, import/export, and configurable reading behavior.

## Product Principles

- Local-first: article storage, search, filters, read state, settings, and
  personalization live locally in IndexedDB.
- Fast reader workflow: the options page is optimized for scanning, keyboard
  navigation, filtering, and reading many articles.
- Safe rendering: feed-provided HTML is untrusted and must be sanitized before
  display.
- Extension-native: popup, content script, background script, and options page
  each have clear responsibilities.
- Incremental delivery: each feature file under `docs/features/` should be
  independently implementable and testable.

## Milestones

### M1: Foundation

- Confirm WXT popup/options/background/content entrypoints.
- Add missing runtime dependencies for RSS parsing and HTML sanitization.
- Define Dexie schema for feeds, groups, articles, article tags, settings, and
  sync metadata.
- Add shared domain types and repository/service boundaries.
- Add baseline settings store with defaults.
- Add i18n foundation with English as the default locale plus Simplified Chinese
  and Japanese resource files.

### M2: Feed Subscription

- Implement manual feed URL subscription.
- Detect RSS/Atom feeds on the active page from popup and content script data.
- Support one-click subscribe from popup.
- Add feed group assignment during subscription.
- Store feed metadata, fetch status, and last refresh result.

### M3: Article Ingestion And List

- Fetch subscribed feeds and normalize entries into article records.
- De-duplicate articles by feed ID plus GUID/link fallback.
- Show inbox, all articles, feed-group scoped lists, favorites, unread, and read
  views.
- Add list sorting by newest/oldest.
- Add virtual scrolling for article lists.
- Add manual article tagging from the reader and list context menu.

### M4: Reading Experience

- Build internal article reading view in options.
- Sanitize HTML, lazy-load images, harden links, and style code blocks.
- Support opening the original article in a new tab.
- Implement read-state triggers and keyboard navigation.

### M5: Search, Filtering, And Personalization

- Implement local weighted search across title, summary, body, author, feed
  name, and article tags.
- Add persistent filters as core navigation, not as a separate modal.
- Add theme, dark mode, font, auto-refresh, article retention, keyboard, reset,
  language, tag management, import/export, and about settings.

### M6: Import, Export, And Maintenance

- Support OPML import/export for feeds and groups.
- Support JSON backup/export for full local data where practical.
- Add retention cleanup by article age.
- Add error surfaces and recovery flows for failed feeds.

### M7: Hardening

- Review extension permissions and host permissions.
- Add tests for parser normalization, sanitization, search ranking, read-state
  transitions, Dexie repositories, i18n fallback behavior, and settings
  migration.
- Verify popup/options flows in Chromium and Firefox builds.
- Profile article list and reader performance with large local libraries.

## Feature Index

- [001 Technical Stack](features/001-technical-stack.md)
- [002 Extension Surfaces](features/002-extension-surfaces.md)
- [003 Internationalization](features/003-internationalization.md)
- [004 Security](features/004-security.md)
- [005 Feed Subscription](features/005-feed-subscription.md)
- [006 Article Reading](features/006-article-reading.md)
- [007 Read State](features/007-read-state.md)
- [008 Article Tags](features/008-article-tags.md)
- [009 Search And Filters](features/009-search-and-filters.md)
- [010 Keyboard Shortcuts](features/010-keyboard-shortcuts.md)
- [011 Settings Personalization](features/011-settings-personalization.md)
- [012 Import Export](features/012-import-export.md)
- [013 Performance](features/013-performance.md)

## Delivery Notes

- `rss-parser` and DOMPurify are required by the plan but are not guaranteed to
  be installed in the current package state.
- Options page is the main application surface. Popup should avoid duplicating
  complex reader behavior.
- New feature requests should be added as `docs/features/NNN-name.md` and
  referenced from this file.
