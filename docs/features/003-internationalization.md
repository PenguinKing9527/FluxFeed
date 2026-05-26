# 003 Internationalization

## Requirement

FluxFeed supports English, Simplified Chinese, and Japanese. English is the
default language and fallback language.

## Supported Locales

| Locale | Language | Role |
| --- | --- | --- |
| `en` | English | Default and fallback |
| `zh-CN` | Simplified Chinese | Supported UI language |
| `ja` | Japanese | Supported UI language |

## Scope

Internationalization covers extension UI copy:

- Popup labels, buttons, empty states, and errors.
- Options navigation, article actions, reader controls, settings, import/export,
  search/filter UI, and dialogs.
- Validation messages and feed refresh errors.
- Keyboard shortcut labels.
- Date, time, count, and relative-time formatting.

Article content, article titles, author names, feed names, and user-created tags
are user data and should not be translated.

## Architecture

- Use i18next and react-i18next.
- Keep English resources complete and use them as fallback.
- Organize resource files by feature namespace, such as `common`, `popup`,
  `options`, `reader`, `settings`, `feeds`, `search`, and `importExport`.
- Store selected language in settings.
- Support a `system` setting value if language auto-detection is implemented.
- Fall back to English for missing keys or unsupported browser locales.

## Implementation Rules

- Do not hard-code user-facing strings in React components.
- Use stable translation keys instead of source text as keys.
- Keep punctuation and keyboard shortcut labels inside translations when the
  phrase differs by language.
- Use locale-aware date/time formatting for article timestamps and refresh
  status.
- Keep RSS/user-generated text out of translation resources.

## Acceptance Criteria

- First launch uses English unless a supported system-language setting is
  intentionally implemented.
- User can switch between English, Simplified Chinese, and Japanese in settings.
- Popup and options update language consistently after the setting changes.
- Missing translations fall back to English without breaking rendering.
- Search/filter behavior is unaffected by UI language.
