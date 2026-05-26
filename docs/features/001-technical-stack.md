# 001 Technical Stack

## Requirement

FluxFeed uses WXT, Dexie, React, shadcn/ui, Zustand, and RSS parsing utilities.
Use shadcn/ui components first. If a needed component is missing, add the
closest shadcn/ui component before writing custom UI.

## Selected Stack

- Extension framework: WXT.
- UI framework: React.
- Component system: shadcn/ui with Tailwind CSS.
- Icons: lucide-react.
- Local database: Dexie over IndexedDB.
- UI state: Zustand.
- Feed parsing: `rss-parser`.
- HTML sanitization: DOMPurify.
- List virtualization: `@tanstack/react-virtual`.

## Notes

- The current package includes WXT, React, Dexie, Zustand, shadcn-related
  dependencies, and `@tanstack/react-virtual`.
- Add `rss-parser` and DOMPurify before implementing feed ingestion and reader
  rendering if they are not already present.
- Keep domain logic separate from React components so parser, search, storage,
  and read-state behavior can be tested independently.
