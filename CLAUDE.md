# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

IMPORTANT: The dev server might already be running on port 3000. Use that one instead of starting a new one

## Development Commands

**Package Manager**: This project uses `pnpm` (see pnpm-lock.yaml)

**Development**:

- `pnpm run dev` or `pnpm dev` - Start development server (runs on port 3000)
- `pnpm run dev -- --open` - Start dev server and open in browser

**Building**:

- `pnpm run build` or `pnpm build` - Build production version
- `pnpm run preview` or `pnpm preview` - Build and preview with Wrangler (Cloudflare)

**Deployment**:

- `pnpm run deploy` or `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm run deploy:dev` or `pnpm deploy:dev` - Deploy to Cloudflare Workers dev environment
- `pnpm run cf-typegen` - Generate Cloudflare Worker types

**Code Quality**:

- `pnpm run check` or `pnpm check` - Run Svelte type checking
- `pnpm run check:watch` - Run Svelte type checking in watch mode
- `pnpm run lint` or `pnpm lint` - Run ESLint
- `pnpm run lint:fix` or `pnpm lint:fix` - Fix linting issues automatically
- `pnpm run format` or `pnpm format` - Format code with Prettier
- `pnpm run format:check` or `pnpm format:check` - Check formatting

**Testing**:

- `pnpm run test:unit` or `pnpm test:unit` - Run unit tests with Vitest
- `pnpm run test:e2e` or `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm test` or `pnpm test` - Run all tests (unit + e2e)

## Architecture

**Framework**: SvelteKit with Svelte 5 using modern runes syntax (`$state`, `$props`)

**Styling**: TailwindCSS 4.0 with and DaisyUI components

**Service Worker**: PWA support with manifest

**Linting/Formatting**:

- ESLint + Prettier with Svelte plugin support
- TypeScript with strict mode enabled

**Testing Setup**:

- **Unit Tests**: Vitest with dual environment setup
- **Component Tests**: Browser environment using Playwright for Svelte components (`.svelte.{test,spec}.{js,ts}` files)
- **Server Tests**: Node environment for server-side code (`.{test,spec}.{js,ts}` files, excluding Svelte component tests)
- **E2E Tests**: Playwright tests in `e2e/` directory

**Data Layer**:

- **Database**: Dexie (IndexedDB wrapper) with Dexie Cloud addon for sync capabilities
- **Backend**: Supabase integration with SSR support
- **Search**: Fuse.js fuzzy search engine with weighted keys (title, keywords, tags)
- **State Management**: Svelte 5 runes (`$state`) for reactive stores
- **Data Architecture**:
  - `BookmarkData` type for database persistence (excludes computed properties)
  - `Bookmark` class with computed properties (faviconUrl, localUrl, hasBody)
  - Dexie `liveQuery` converted to Svelte readable stores for reactivity
  - **Database Utilities**: Centralized CRUD operations in utility modules
    - `src/lib/db/bookmarks.ts` - Bookmark operations (create, read, update, delete)
    - `src/lib/db/notes.ts` - Notes operations
    - Components should use these utilities instead of direct `db.bookmarks` or `db.notes` access

**Metadata Extraction**:

- External API: `https://metadata.breader.app/process` extracts title, description, keywords, image, etc.
- Requires `METADATA_API_KEY` environment variable (set via `wrangler secret put METADATA_API_KEY`)
- Flow: add-bookmark pages → `/api/fetch-metadata` → external API → service worker → IndexedDB

**Core Stores**:

- `src/lib/stores/search.svelte.ts` - Search engine and filters using derived stores
- `src/lib/stores/theme.svelte.ts` - Theme persistence and switching with DaisyUI
- `src/lib/stores/installPWA.svelte.ts` - PWA installation prompt handling

**Database Schema**:

- `bookmarks` table with indexes on: id, title, url, tags (multi-entry), keywords (multi-entry), isStarred, status, created, modified
  - Status field uses BookmarkStatus enum: ARCHIVED (0), READING (1), READ (2), WANT_TO_READ (3)
- `notes` table with indexes on: id, bookmarks (multi-entry), created, modified
  - Many-to-many relationship: notes can be associated with multiple bookmarks via `bookmarks` array
  - Auto-generated IDs via Dexie
- `favicons` table with indexes on: id, domain (unique), failed, createdAt, modifiedAt
  - Domain-level caching: multiple bookmarks from same domain share one favicon entry
  - Stores base64 data URIs (max 5KB) for offline display
  - Failed fetches tracked with 7-day retry window
- UUID primary keys generated via custom Dexie plugin

**Key Files**:

- `src/lib/db/index.ts` - Dexie database setup and schema
- `src/lib/db/notes.ts` - Notes CRUD operations and queries
- `src/lib/db/favicons.ts` - Favicon caching operations (domain-level)
- `src/lib/types/bookmark.ts` - Bookmark class and BookmarkData type definitions
- `src/lib/stores/search.svelte.ts` - Search functionality with Fuse.js integration
- `src/lib/stores/bookmarkNotes.svelte.ts` - Reactive store for bookmark notes
- `src/lib/utils/faviconResolver.ts` - Client-side favicon resolution with caching
- `src/lib/components/Favicon.svelte` - Reusable favicon component with async loading
- `src/routes/bookmark/[uuid]/+page.svelte` - Bookmark detail page with notes management

**Critical Architecture Notes**:

- Dexie liveQuery observables must be converted to Svelte readable stores using `readable()` wrapper for compatibility with `derived()` stores
- Search store uses derived stores pattern to automatically rebuild search index when bookmark data changes
- Bookmark page uses liveQuery wrapped in readable store for notes reactivity (see `bookmarkNotes.svelte.ts`)
- Notes are persisted to database immediately on save (no local state management)
- Dexie auto-generates note IDs; temporary UUIDs are not persisted
- Theme switching happens immediately via localStorage and DOM data-theme attribute
- No need to install new icon sets like '@iconify-json/material-symbols' since '@iconify/json' includes all
- All types should be defined in `$lib/types` and imported from there, e.g. `import { BookmarkStatus } from '$lib/types';`
- **Favicon Caching**: Use `<Favicon url={url} />` component instead of `bookmark.faviconUrl` for cached offline favicon display. The resolver checks IndexedDB first, then fetches via `/api/fetch-favicon` on cache miss.
