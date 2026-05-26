# 009 Search And Filters

## Requirement

Users can quickly locate content in the local article library. Search is fully
local and sends no network requests.

## Search Fields

Search covers:

- Article title.
- Summary.
- Body/content.
- Author.
- Feed name.
- Article tags.

## Ranking

Weights should prefer stronger intent signals:

- Title: highest.
- Feed name and article tags: high.
- Summary: medium.
- Author: medium-low.
- Body/content: low.

## Filters

Filters are core navigation elements:

- All.
- Favorites.
- Unread.
- Read.
- Inbox.
- Feed group.
- Tag.

Single-feed narrowing should not be a separate primary filter. Feed name and
article tags remain searchable fields and ranking signals.

Tag navigation is available from the left sidebar, alongside feed groups. When a
user selects a tag in the sidebar, the article list is scoped to articles with
that tag. Search composes with the active sidebar scope.

## Acceptance Criteria

- Search responds without network access.
- Search and filters compose.
- Selecting a tag from the left sidebar scopes results to articles with that tag.
- Clearing search returns to the active filter scope.
- Results are stable and sorted by relevance, then selected article sort order.
