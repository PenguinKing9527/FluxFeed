# 012 Import Export

## Requirement

FluxFeed supports importing and exporting user data.

## Import

- OPML import for feeds and groups.
- JSON backup import for FluxFeed-specific data when available.
- Duplicate feed handling by normalized feed URL.
- Import result summary with added, skipped, and failed counts.

## Export

- OPML export for feeds and groups.
- JSON backup export for settings, feeds, groups, article tags,
  read/favorite state, and optional article metadata.

## Acceptance Criteria

- OPML export can be imported by common RSS readers.
- Re-importing the same OPML file does not duplicate feeds.
- Import errors identify the failing feed or file section.
- JSON backup preserves user settings and organization data.
