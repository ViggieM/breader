# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: This project uses `pnpm` (see pnpm-lock.yaml)

**Development**:
- `npm run dev` or `pnpm dev` - Start development server
- `npm run dev -- --open` - Start dev server and open in browser

**Building**:
- `npm run build` or `pnpm build` - Build production version
- `npm run preview` or `pnpm preview` - Preview production build

**Code Quality**:
- `npm run check` or `pnpm check` - Run Svelte type checking
- `npm run check:watch` - Run Svelte type checking in watch mode

**Testing**:
- `npm run test:unit` or `pnpm test:unit` - Run unit tests with Vitest
- `npm run test:e2e` or `pnpm test:e2e` - Run end-to-end tests with Playwright
- `npm test` or `pnpm test` - Run all tests (unit + e2e)

## Architecture

**Framework**: SvelteKit with Svelte 5 using modern runes syntax (`$props()`)

**Styling**: TailwindCSS 4.0 with `@tailwindcss/forms` plugin

**Testing Setup**:
- **Unit Tests**: Vitest with browser environment using Playwright
- **Component Tests**: Svelte components tested in browser environment (`.svelte.{test,spec}.{js,ts}` files)
- **Server Tests**: Node environment for server-side code (`.{test,spec}.{js,ts}` files, excluding Svelte component tests)
- **E2E Tests**: Playwright tests in `e2e/` directory

**Build Tools**:
- Vite with SvelteKit plugin
- TypeScript with strict mode enabled
- Auto-adapter for deployment flexibility

**Project Structure**:
- `src/routes/` - SvelteKit pages and layouts
- `src/lib/` - Reusable components and utilities (imported via `$lib` alias)
- `src/lib/assets/` - Static assets like images and icons
- `static/` - Public static files
- `e2e/` - End-to-end tests

**Key Files**:
- `src/app.html` - HTML template
- `src/app.css` - Global styles (Tailwind imports)
- `src/routes/+layout.svelte` - Root layout component
- `vite.config.ts` - Vite configuration with dual test environments
- `playwright.config.ts` - E2E test configuration