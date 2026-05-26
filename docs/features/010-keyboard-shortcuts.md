# 010 Keyboard Shortcuts

## Requirement

Keyboard shortcuts support fast article navigation and reading.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `j` / `ArrowDown` | Next article |
| `k` / `ArrowUp` | Previous article |
| `o` / `Enter` | Open original article in a new tab |
| `m` | Toggle read/unread |
| `s` | Toggle favorite |
| `Esc` | Return to article list |
| `r` | Refresh current feed |

## Scope

Shortcuts apply inside the options reading workspace. Text inputs, textareas,
and editable elements should not be hijacked.

## Acceptance Criteria

- Navigation shortcuts select the expected article.
- Reader shortcuts work when an article is focused.
- Shortcuts do not interfere with typing in search, feed URL, tag, or settings
  fields.
- Shortcut settings can display or later customize bindings.
