# FluxFeed Agent Guide

FluxFeed is a browser extension RSS reader built with WXT, React, shadcn/ui,
Zustand, Dexie, and RSS parsing utilities. Treat this repository as a
browser-extension app first: popup and options pages are the product surface,
and background/content scripts provide extension integration.

## Project Rules

- Keep product docs in `docs/`.
- Add new feature requirements as numbered Markdown files under
  `docs/features/`, using the next available `NNN-feature-name.md` prefix.
- Keep `docs/PLAN.md` focused on roadmap, milestones, and delivery order.
- Keep `docs/architecture.md` focused on system boundaries, data flow,
  storage, security, and performance decisions.
- Prefer shadcn/ui components. If a needed component is missing, add it through
  the shadcn workflow before building a custom component.
- Keep extension permissions minimal and document any new permission in
  `docs/architecture.md`.
- Save Markdown and source files as UTF-8 without BOM. If PowerShell shows
  mojibake before the first `#`, or the first bytes are `EF BB BF`, treat it as
  a likely UTF-8 BOM (`U+FEFF`) issue and remove the BOM before continuing.

## Technical Direction

- Framework: WXT with React entrypoints.
- UI: React 19, Tailwind CSS, shadcn/ui, lucide-react.
- State: Zustand for UI/session state.
- Persistence: Dexie over IndexedDB for feeds, articles, folders, article tags,
  settings, and sync metadata.
- Parsing: `rss-parser` for feed parsing. Add it before implementing feed
  ingestion if it is not already installed.
- Internationalization: use i18next/react-i18next. Supported locales are English
  (`en`, default), Simplified Chinese (`zh-CN`), and Japanese (`ja`).
- HTML safety: sanitize feed HTML before rendering. DOMPurify is the preferred
  sanitizer.
- Long lists: use virtual scrolling for article lists.

## Implementation Expectations

- Popup is lightweight: article list preview, current-page RSS detection,
  one-click subscribe, and link to options.
- Options is the main app: feed groups, inbox, favorites, article list,
  article reader, article tags, search/filtering, settings, import/export, and
  source links.
- Reading state must support automatic and manual transitions, including
  open-as-read, scroll-past-80-percent-as-read, item dot toggle, context menu,
  batch operations, and mark-current-view-read.
- Keyboard shortcuts must work inside the reader/list context without breaking
  browser/system shortcuts.
- Search stays local. Do not add network search for article contents.
- Tags belong to articles, not feeds. Tags are plain text labels such as
  `值得二读`, `技术参考`, and `待调研`; search must support `tag:<label>`.
- All user-facing strings in popup and options must go through i18n keys. Do not
  hard-code interface copy in React components.

## Verification

Before claiming a feature is complete, run the relevant checks:

- `pnpm compile`
- `pnpm lint`
- `pnpm build`

If a command cannot run in the local environment, document the failure and the
reason in the final response.
