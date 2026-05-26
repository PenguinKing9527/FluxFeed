# 004 Security

## Requirement

FluxFeed must prevent XSS and unsafe behavior from untrusted feed content.

## Rules

- Treat feed XML, feed metadata, article HTML, author fields, links, and images
  as untrusted.
- Sanitize article HTML with DOMPurify before rendering.
- Do not render unsanitized HTML with `dangerouslySetInnerHTML`.
- Remove scripts, inline event handlers, unsafe attributes, and unsafe URL
  schemes.
- Rewrite external links with `target="_blank"` and `rel="noopener noreferrer"`.
- Avoid extension API access from rendered article content.

## Acceptance Criteria

- Script tags and event handlers in feed content do not execute.
- `javascript:` and other unsafe links are removed or neutralized.
- Sanitization logic has focused tests with malicious sample inputs.
- Security behavior is shared across all reader surfaces.
