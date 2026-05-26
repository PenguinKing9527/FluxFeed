# 005 Feed Subscription

## Requirement

Feed subscription supports manual URL entry, current-page RSS detection, and
group management.

## User Flows

- User enters a feed URL manually and subscribes.
- User opens popup on a website and sees detected RSS/Atom candidates.
- User subscribes to a detected candidate with one click.
- User assigns a feed to a group during or after subscription.

## Feed Detection

Detect candidates from page markup:

- `<link rel="alternate" type="application/rss+xml">`
- `<link rel="alternate" type="application/atom+xml">`
- common RSS/Atom MIME types and labels

Content script should collect page-local candidates. Popup/background should
coordinate active-tab access and subscription actions.

## Storage

Store feed URL, site URL, title, description, group ID, refresh state, and
timestamps. Feed URL should be normalized to prevent duplicate subscriptions.

## Acceptance Criteria

- Duplicate feed URLs do not create duplicate subscriptions.
- Invalid or unreachable URLs produce clear errors.
- A feed can be moved between groups.
