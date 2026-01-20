# Breader

A modern, offline-first bookmark manager built as a Progressive Web App (PWA).
Available for use on [breader.app](https://breader.app/)

## Features

- **Offline-First**: All bookmarks stored locally in IndexedDB via Dexie, with optional cloud sync
- **PWA Support**: Install as a native-like app on any device
- **Fuzzy Search**: Fast search with Fuse.js across titles, keywords, and tags
- **Notes**: Attach notes to bookmarks with many-to-many relationships
- **Reading Status**: Track bookmarks as Want to Read, Reading, Read, or Archived
- **Tags & Organization**: Multi-entry tag indexing for flexible categorization
- **Automatic Metadata**: Extracts title, description, keywords, and images from URLs
- **Favicon Caching**: Domain-level favicon storage for offline display
- **Theme Support**: Light/dark themes via DaisyUI

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 (runes syntax)
- **Styling**: TailwindCSS 4.0 + DaisyUI
- **Database**: Dexie (IndexedDB) with Dexie Cloud addon
- **Backend**: Supabase for auth, Cloudflare Workers for deployment
- **Testing**: Vitest (unit) + Playwright (e2e)

## Getting Started

```sh
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Deploy to Cloudflare
pnpm deploy
```

## License

Private
