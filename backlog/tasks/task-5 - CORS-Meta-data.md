---
id: task-5
title: CORS Meta data
status: Done
assignee: []
created_date: '2025-08-30 18:03'
updated_date: '2025-09-05 11:01'
labels: []
dependencies: []
ordinal: 2000
---

## Description

When adding a bookmark, especially on mobile, a CORS request needs to be made to extract following informations from a website:

- title
- description (meta:description) OR create a summary
- extract keywords

## Acceptance Criteria

- [x] CORS proxy endpoint handles cross-origin requests from PWA
- [x] Metadata extraction works for title, description, and keywords
- [x] Bookmark form auto-populates fields when URL is entered
- [x] User can still manually override auto-filled fields
- [x] Implementation handles errors gracefully without breaking form
- [x] Code follows existing project patterns and TypeScript conventions

## Implementation Plan

### Phase 1: Foundation

1. Create basic CORS proxy endpoint at `/api/fetch-metadata`
2. Add HTML metadata extraction logic

### Phase 2: Integration

3. Create frontend metadata fetching utility
4. Integrate with existing bookmark form

### Technical Approach

- Use SvelteKit API routes for CORS proxy (leverages existing Cloudflare Workers infrastructure)
- Parse HTML server-side to extract common meta tag patterns
- Auto-populate form fields with debouncing to avoid excessive requests
- Non-intrusive integration that preserves existing form behavior

## Implementation Notes

### Files Created/Modified

- **Created**: `src/routes/api/fetch-metadata/+server.ts` - CORS proxy endpoint with metadata extraction
- **Created**: `src/lib/utils/metadata.ts` - Frontend utility for fetching URL metadata
- **Created**: `src/lib/utils/url-validation.ts` - Shared URL validation utilities with SSRF protection
- **Modified**: `src/routes/add-bookmark/+page.svelte` - Integrated auto-metadata fetching with debouncing

### Technical Decisions

- **CORS Proxy**: Implemented as SvelteKit API route to leverage existing Cloudflare Workers deployment
- **HTML Parsing**: Used regex-based approach for simplicity and reliability across various HTML formats
- **Debouncing**: 500ms delay to prevent excessive API calls while user types URL
- **Error Handling**: Silent failures to avoid disrupting user experience, with console warnings for debugging
- **User Override**: Only auto-fills empty fields, preserves user input if they've already typed something

### Features Implemented

- Automatic title extraction from `<title>`, `og:title`, and `twitter:title` tags
- Description extraction from `meta[name="description"]`, `og:description`, and `twitter:description` tags
- Keywords extraction from `meta[name="keywords"]` and integration with existing tags
- Loading indicator during metadata fetching
- Graceful timeout handling (10 seconds) with proper error messages
- Non-intrusive integration that preserves existing form functionality

### Security Improvements Applied

- **SSRF Protection**: Blocks access to private IP ranges (127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x) and localhost
- **Response Size Limits**: 1MB maximum response size with streaming processing to prevent DoS attacks
- **ReDoS Protection**: Limited regex processing to 50KB of HTML with bounded quantifiers
- **Input Sanitization**: Comprehensive HTML entity decoding with validation
- **Error Message Sanitization**: Generic error responses to prevent information leakage
- **Content Security Policy**: Added CSP headers to prevent XSS from extracted metadata
- **Content Length Validation**: Limits on title (500 chars), description (1000 chars), and keywords (20 max, 50 chars each)
