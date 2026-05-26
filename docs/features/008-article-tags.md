# 008 Article Tags

## Requirement

Users can manually add plain text tags to articles. Tags belong to articles, not
feeds.

## Tag Model

- A tag is a plain text string.
- Example tags: `Worth Reading`, `Tech Reference`, `To Research`.
- One article can have multiple tags.
- The same tag label can be reused across many articles.
- Empty labels and duplicate labels on the same article are not allowed.

## Entry Points

- Reading view footer: add, remove, and view tags for the current article.
- Article list item context menu: add or remove tags without opening the
  article.
- Left sidebar: select a tag to scope the article list, alongside feed groups.
- Settings -> Tag management: manage the global tag list.

## Settings Tag Management

The global tag management view supports:

- Rename: change a tag label everywhere it is used.
- Merge: move all article relations from one or more source tags into a target
  tag, then remove the source tag definitions.
- Delete: remove a tag definition and remove that tag from all articles.

## Search Integration

Article tags contribute to search ranking when users search normal text.

Search composes with the active tag scope from the left sidebar. Tags are not
filtered through dedicated search syntax.

## Acceptance Criteria

- A user can add multiple tags to one article.
- Tag changes persist in Dexie and update the reader and article list.
- The reading view footer can add and remove tags for the open article.
- The article list context menu can add and remove tags for that list item.
- Settings tag management can rename, merge, and delete tags.
- Tags appear in the left sidebar and can be selected to scope the article list.
