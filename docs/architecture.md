# FluxFeed Architecture

## Overview

FluxFeed is a WXT browser extension with four extension surfaces:

- Popup: quick article list preview, active-page RSS detection, one-click
  subscribe, and navigation to options.
- Options: the main RSS reader application.
- Background script: periodic feed refresh, context menus, tab operations, and
  extension messaging coordination.
- Content script: current-page RSS/Atom discovery and page metadata extraction.

The app stores feed and article data locally in IndexedDB through Dexie. UI
state that does not need durable persistence uses Zustand. Durable preferences
are stored through a settings repository and mirrored into Zustand for rendering.

## Module Boundaries

### Domain

Domain modules should own stable types and pure logic:

- Feed, feed group, article tag, article, article content, settings, and refresh
  result types.
- Feed entry normalization and de-duplication rules.
- Search indexing/ranking rules.
- Read-state transition rules.
- Import/export mapping.
- Locale and translation key conventions.

### Storage

Dexie repositories should hide IndexedDB details from UI components:

- `feeds`: subscribed feeds, source URL, site URL, title, group ID, status.
- `feedGroups`: user-defined groups.
- `tags`: user-created article tag definitions stored as plain text labels.
- `articleTags`: article-to-tag relation.
- `articles`: normalized article metadata and read/favorite state.
- `articleContents`: sanitized or extracted article content where storage is
  needed separately from metadata.
- `settings`: durable user preferences and schema version.
- `refreshLogs`: recent feed refresh status for diagnostics.

### Services

Services coordinate domain logic, storage, and extension APIs:

- Feed discovery service: collects feed links from content scripts and page
  markup.
- Subscription service: validates URLs, parses feed metadata, stores feeds, and
  assigns feed groups.
- Refresh service: fetches feeds, parses RSS/Atom, normalizes articles, and
  updates refresh metadata.
- Reader service: prepares trusted render data for article views.
- Search service: builds weighted local results from IndexedDB records.
- Tag service: adds/removes article tags and supports tag rename, merge, and
  delete operations.
- Import/export service: OPML and JSON backup flows.
- Settings service: default values, migrations, reset, and persistence.
- I18n service: initializes locale resources, applies locale settings, and
  provides fallback behavior.

### UI

React components should stay close to the surface they serve:

- `entrypoints/popup`: popup-specific detection and subscription UI.
- `entrypoints/options`: app shell, sidebar navigation, article list, reader,
  settings, import/export, and search/filter views.
- `components/ui`: shadcn/ui primitives.
- shared feature components can be added under a feature-oriented directory when
  behavior is reused by popup and options.

## Internationalization

FluxFeed supports English, Simplified Chinese, and Japanese. English is the
default locale and fallback language. Locale resources should be organized by
feature namespace so popup, options, settings, reader, import/export, and shared
validation copy can evolve independently.

User-facing React copy should use translation keys through i18next/react-i18next
instead of hard-coded strings. Feed content, article titles, author names, feed
names, and user-created article tags are user data and should not be translated.
Dates, counts, and relative time labels should use locale-aware formatting.

The selected language is a durable setting. If the setting is `system`, the app
may derive the best supported locale from the browser language and fall back to
English when no supported match exists.

## Data Flow

1. Content script scans the active page for `<link rel="alternate">` RSS/Atom
   links and reports candidates to popup/background on request.
2. Popup shows detected candidates and allows one-click subscription.
3. Subscription service fetches and parses the selected feed URL, then writes
   feed metadata to Dexie.
4. Background refresh service periodically fetches subscribed feeds and writes
   normalized articles.
5. Options page queries Dexie for the selected navigation scope and renders a
   virtualized article list.
6. Opening an article loads sanitized content into the internal reader.
7. Read/favorite actions update Dexie and optimistic Zustand state.

## Reading Content Pipeline

Feed-provided HTML is untrusted. The rendering pipeline must:

1. Parse or accept feed content from the normalized article.
2. Sanitize HTML with DOMPurify.
3. Remove unsafe attributes, scripts, event handlers, and dangerous URL schemes.
4. Add lazy loading to images.
5. Rewrite links to open in new tabs with `noopener noreferrer`.
6. Apply readable typography styles.
7. Style code blocks and preserve preformatted content.

Full-article extraction can be added after baseline feed-content rendering. If
implemented, extracted content must pass through the same sanitizer.

## Search Architecture

Search is local only. The search service should rank fields with different
weights:

- Title: highest weight.
- Feed name and article tags: high weight.
- Summary: medium weight.
- Author: medium-low weight.
- Body/content: lower weight because it is noisy.

Search results should compose with navigation filters such as unread, read,
favorites, inbox, and group. Filters are part of the main navigation model, not
a separate popup panel. Single-feed and tag narrowing are search concerns rather
than primary navigation filters; tag filtering uses the `tag:<label>` query
syntax.

## Article Tag Model

Tags belong to articles, not feeds. A tag is a plain text label such as
`值得二读`, `技术参考`, or `待调研`. One article can have multiple tags.

Tag entry points:

- Reading view footer.
- Article list item context menu.
- Settings -> Tag management.

Settings tag management must support rename, merge, and delete. Rename updates
the label everywhere. Merge moves article relations from one or more source tags
into a target tag and removes the source tag definitions. Delete removes the tag
definition and all article relations for that tag.

## Read-State Model

Articles support `unread`, `read`, and `favorite` flags. Read transitions can be
triggered by:

- Opening article reader when the `markReadOnOpen` setting is enabled.
- Scrolling past 80 percent of article content by default.
- Clicking the read-state dot in the list.
- Context menu action.
- Batch list operations.
- Marking the current view as read from the toolbar.

Each transition should be idempotent and persisted immediately.

## Extension Permissions

The extension currently requests storage, context menus, active tab, scripting,
tabs, and broad host permissions. Revisit permissions during implementation:

- Keep `storage` for browser settings or extension metadata if used.
- Keep `contextMenus` only when read-state context menus are implemented.
- Use `activeTab` and `scripting` for page RSS detection where possible.
- Broad host permissions may be needed for feed fetching, but should be
  documented and minimized where browser APIs allow.

## Security

- Treat all feed content and feed metadata as untrusted.
- Sanitize before using `dangerouslySetInnerHTML`.
- Never execute scripts from feed content.
- Never preserve inline event handlers.
- Normalize external links and block unsafe protocols.
- Avoid logging full article bodies or sensitive browsing-derived data.

## Performance

- Use Dexie indexes for common queries: feed, group, unread, favorite, published
  time, and refresh state.
- Use virtual scrolling for article lists.
- Batch feed refresh writes in Dexie transactions.
- Avoid loading full article bodies for list rendering.
- Debounce search input and perform cheap pre-filtering before scoring.
- Apply article retention cleanup according to settings.
- Keep popup queries small and fast.
- Load only the locale resources needed by the active UI surface where practical.
