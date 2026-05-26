# 013 Performance

## Requirement

FluxFeed must remain responsive with large local feed libraries.

## Requirements

- Article lists use virtual scrolling.
- List rows load metadata only, not full article bodies.
- Dexie queries use indexes for common scopes and sort keys.
- Feed refresh writes are batched in transactions.
- Search input is debounced.
- Search ranking avoids scoring unnecessary records after filters narrow scope.
- Popup reads small summaries only.
- Article retention cleanup prevents unbounded local growth.

## Acceptance Criteria

- Large article lists scroll smoothly.
- Popup opens quickly even with many stored articles.
- Feed refresh does not block options page interactions.
- Searching within a filtered view responds immediately for typical local data
  sizes.
