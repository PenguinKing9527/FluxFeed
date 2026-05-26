# 011 Settings Personalization

## Requirement

Settings and personalization control appearance, reading behavior, refresh, data
retention, tag management, import/export, shortcuts, reset, and about
information.

## Settings

- Theme.
- Dark mode.
- Reader font.
- Read-state judgment behavior.
- Auto-refresh interval.
- Tag management.
- Import/export.
- Article retention days.
- Reset settings.
- Keyboard shortcuts.
- About.

## Defaults

- Scroll past 80 percent marks an article read.
- Open-as-read is configurable.
- Auto-refresh is enabled with a conservative interval.
- Article retention defaults should avoid surprising data loss.

## Acceptance Criteria

- Settings persist across sessions.
- Tag management supports rename, merge, and delete for user-created article
  tags.
- Reset restores documented defaults.
- Theme changes affect popup and options consistently.
- Retention cleanup is explicit and respects the configured number of days.
