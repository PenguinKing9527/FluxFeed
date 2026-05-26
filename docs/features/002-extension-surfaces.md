# 002 Extension Surfaces

## Requirement

FluxFeed supports both popup and options pages.

## Popup

Popup is a compact workflow surface:

- Show a small recent article list or unread summary.
- Detect RSS/Atom feeds on the active page.
- Support one-click subscribe for detected feeds.
- Link to the options page.

Popup should stay fast and avoid complex reader interactions.

## Options

Options is the core app:

- Feed groups.
- Article tag management.
- Inbox.
- Favorites.
- Article list.
- Article reader.
- Internal reading view.
- Open original article in a new tab.
- Settings.
- Import/export.
- Search and filtering.

## Acceptance Criteria

- Popup can subscribe to a detected feed without opening options.
- Popup can open options.
- Options can perform the full reading workflow.
- Shared services are reused instead of duplicating subscription or storage
  logic between popup and options.
