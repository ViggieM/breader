# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: This project uses `pnpm` (see pnpm-lock.yaml)

**Development**:
- `pnpm run dev` or `pnpm dev` - Start development server
- `pnpm run dev -- --open` - Start dev server and open in browser

**Building**:
- `pnpm run build` or `pnpm build` - Build production version
- `pnpm run preview` or `pnpm preview` - Preview production build

**Code Quality**:
- `pnpm run check` or `pnpm check` - Run Svelte type checking
- `pnpm run check:watch` - Run Svelte type checking in watch mode
- `pnpm run lint` or `pnpm lint` - Run Biome linting
- `pnpm run lint:fix` or `pnpm lint:fix` - Fix linting issues automatically
- `pnpm run format` or `pnpm format` - Format code with Biome
- `pnpm run format:check` or `pnpm format:check` - Check formatting

**Testing**:
- `pnpm run test:unit` or `pnpm test:unit` - Run unit tests with Vitest
- `pnpm run test:e2e` or `pnpm test:e2e` - Run end-to-end tests with Playwright
- `pnpm test` or `pnpm test` - Run all tests (unit + e2e)

## Architecture

**Framework**: SvelteKit with Svelte 5 using modern runes syntax (`$props()`)

**Styling**: TailwindCSS 4.0 with `@tailwindcss/forms` plugin and DaisyUI components
- **Icons**: Iconify icons via `@iconify/tailwind4` (class format: `icon-[iconset--icon-name]`)
- **Themes**: DaisyUI theme system with localStorage persistence (light, dark, retro, cyberpunk, valentine, aqua)

**Testing Setup**:
- **Unit Tests**: Vitest with browser environment using Playwright
- **Component Tests**: Svelte components tested in browser environment (`.svelte.{test,spec}.{js,ts}` files)
- **Server Tests**: Node environment for server-side code (`.{test,spec}.{js,ts}` files, excluding Svelte component tests)
- **E2E Tests**: Playwright tests in `e2e/` directory

**Build Tools**:
- Vite with SvelteKit plugin
- TypeScript with strict mode enabled
- Auto-adapter for deployment flexibility
- **Linting/Formatting**: Biome (replaces ESLint/Prettier)
- **Service Worker**: PWA support with caching strategy

**Project Structure**:
- `src/routes/` - SvelteKit pages and layouts
- `src/lib/` - Reusable components and utilities (imported via `$lib` alias)
- `src/lib/assets/` - Static assets like images and icons
- `static/` - Public static files
- `e2e/` - End-to-end tests

**Data Layer**:
- **Storage**: localStorage for bookmark persistence via `BookmarkStore` class
- **Search**: Fuse.js fuzzy search engine with weighted keys (title, description, tags, keywords)
- **State Management**: Svelte 5 runes (`$state`) for reactive stores
- **Types**: Custom `Bookmark` class with computed properties (faviconUrl, localUrl)
- **Core Stores**:
  - `bookmarkStore` - CRUD operations for bookmarks
  - `theme` - Theme persistence and switching
  - `installPWA` - PWA installation prompt handling

**Key Files**:
- `src/app.html` - HTML template
- `src/app.css` - Global styles (Tailwind imports)
- `src/routes/+layout.svelte` - Root layout component
- `src/lib/stores/bookmarks.ts` - Main data store for bookmark management
- `src/lib/search.ts` - Fuse.js search engine implementation
- `src/lib/types/bookmark.ts` - Bookmark data model
- `vite.config.ts` - Vite configuration with dual test environments
- `playwright.config.ts` - E2E test configuration
- `biome.json` - Biome configuration with Svelte-specific rules
