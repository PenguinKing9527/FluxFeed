# 007 Read State

## Requirement

FluxFeed manages read/unread state through automatic and manual actions.

## Triggers

- Opening article reading view marks the article read when
  `markReadOnOpen` is enabled.
- Scrolling beyond 80 percent of article content marks the article read by
  default.
- Clicking the list item dot toggles read/unread.
- Right-click context menu can mark an article read.
- Batch list operations can mark selected items read.
- Toolbar action "mark all read" clears unread state for the current view.

## Behavior

- Read-state changes are persisted immediately.
- Repeating a mark-read action is idempotent.
- Manual unread toggles should not be overwritten until a new explicit trigger
  occurs.
- Current view means the active navigation/filter/search scope.

## Acceptance Criteria

- Each trigger updates the article row in Dexie.
- Current-view bulk operations affect only visible scope.
- Counts update after state changes.
- Settings can disable open-as-read while keeping scroll-as-read behavior.
