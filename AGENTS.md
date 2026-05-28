# AGENTS.md

## Project Context

This repository is FluxFeed, an RSS reader browser extension project. Before making product, architecture, UI, or feature changes, read the project documents under `docs/`.

## Required References

- `docs/plan.md` is the project plan. Use it to understand the product goals, phases, scope, and priorities.
- `docs/architecture.md` is the overall architecture. Implementation choices should follow this architecture unless the change explicitly updates it.
- `docs/ui/` contains the UI layout and visual direction. The UI component elements in this directory are not exhaustive; they define the intended layout, interaction direction, and general style rather than a complete component library.
- `docs/features/` contains the required feature specifications. These features must be implemented.

## Feature Documentation Rules

- Every new feature must be documented in `docs/features/`.
- When adding or changing a feature, create or update the corresponding Markdown file in `docs/features/` before or alongside the implementation.
- Feature docs should describe the user-facing behavior, key states, data requirements, and any architecture or UI implications.

## Implementation Guidance

- Treat `docs/plan.md` as the roadmap and source of priority.
- Treat `docs/architecture.md` as the source of system boundaries and technical structure.
- Treat `docs/ui/` as the design direction for screens and components, while filling in missing UI details consistently.
- Keep implementation work aligned with the feature files in `docs/features/`.
