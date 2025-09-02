# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Styling**: TailwindCSS 4.0 with `@tailwindcss/forms` plugin and DaisyUI components

- **Icons**: Iconify icons via `@iconify/tailwind4` (class format: `icon-[iconset--icon-name]`)
- **Themes**: DaisyUI theme system with localStorage persistence (light, dark, retro, cyberpunk, valentine, aqua)

**Testing Setup**:

- **Unit Tests**: Vitest with dual environment setup
- **Component Tests**: Browser environment using Playwright for Svelte components (`.svelte.{test,spec}.{js,ts}` files)
- **Server Tests**: Node environment for server-side code (`.{test,spec}.{js,ts}` files, excluding Svelte component tests)
- **E2E Tests**: Playwright tests in `e2e/` directory

**Build Tools**:

- Vite with SvelteKit plugin and TailwindCSS integration
- TypeScript with strict mode enabled
- Cloudflare Workers adapter for serverless deployment
- Wrangler for Cloudflare deployment and development
- **Linting/Formatting**: ESLint + Prettier with Svelte plugin support
- **Service Worker**: PWA support with manifest

**Data Layer**:

- **Database**: Dexie (IndexedDB wrapper) with Dexie Cloud addon for sync capabilities
- **Backend**: Supabase integration with SSR support
- **Search**: Fuse.js fuzzy search engine with weighted keys (title, keywords, tags)
- **State Management**: Svelte 5 runes (`$state`) for reactive stores
- **Data Architecture**:
  - `BookmarkData` type for database persistence (excludes computed properties)
  - `Bookmark` class with computed properties (faviconUrl, localUrl, hasBody)
  - Dexie `liveQuery` converted to Svelte readable stores for reactivity

**Core Stores**:

- `src/lib/stores/search.svelte.ts` - Search engine and filters using derived stores
- `src/lib/stores/theme.svelte.ts` - Theme persistence and switching with DaisyUI
- `src/lib/stores/installPWA.svelte.ts` - PWA installation prompt handling

**Database Schema**:

- Single `bookmarks` table with indexes on: id, title, url, tags (multi-entry), keywords (multi-entry), isStarred, isReviewed, created, modified
- UUID primary keys generated via custom Dexie plugin

**Key Files**:

- `src/lib/db/index.ts` - Dexie database setup and schema
- `src/lib/types/bookmark.ts` - Bookmark class and BookmarkData type definitions
- `src/lib/stores/search.svelte.ts` - Search functionality with Fuse.js integration
- `vite.config.ts` - Dual test environment configuration (browser/node)
- `src/app.html` - HTML template with theme initialization script

**Critical Architecture Notes**:

- Dexie liveQuery observables must be converted to Svelte readable stores using `readable()` wrapper for compatibility with `derived()` stores
- Search store uses derived stores pattern to automatically rebuild search index when bookmark data changes
- Theme switching happens immediately via localStorage and DOM data-theme attribute
