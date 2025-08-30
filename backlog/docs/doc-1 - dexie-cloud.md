---
id: doc-1
title: dexie-cloud
type: other
created_date: '2025-08-26 07:31'
---

# Dexie Cloud Setup Guide

This guide documents how the Dexie Cloud authentication is set up in the Breader application, enabling real-time synchronization of bookmark data across devices.

## Overview

The Breader application uses a hybrid authentication architecture that combines:

- **Supabase**: Handles user authentication
- **Dexie Cloud**: Provides real-time database synchronization with offline support
- **Custom Token Bridge**: SvelteKit API endpoint (`/dexie-cloud-tokens`) that securely exchanges Supabase authentication for Dexie Cloud tokens

Notes:

- Authentication via a magic link is not a viable option because magic links open in the browser and not in the PWA app, which is a hard requirement.
- Users can use the application without logging in. Dexie Cloud will ensure the creation and management of a local IndexDB.
  As soon as the user authenticates, a login of the user is made in the cloud, and the evaluation period starts.
- The `dexie-export-import` package cannot be used with dexie-cloud seamlessly

### Authentication Flow

MOTE: magic link authentication will be replaced for OAuth or OTP login

1. User authenticates with Supabase using magic link email authentication
2. Client-side Dexie requests tokens via the custom `/dexie-cloud-tokens` endpoint
3. Server validates Supabase session and requests tokens from Dexie Cloud using client credentials
4. Dexie Cloud returns tokens that allow the user to sync their data
5. Client uses tokens to establish real-time sync connection

## Prerequisites

### Required Services

1. **Dexie Cloud Account**
   - For details, see: https://dexie.org/cloud/#getting-started
   - Make sure to whitelist all production and local URLs, otherwise authentication will not be allowed

2. **Supabase Project**
   - Existing Supabase project
   - Project URL and anon key available

### Dependencies

The following packages are required:

```json
{
	"dexie": "^4.0.8",
	"dexie-cloud-addon": "^4.0.7",
	"@supabase/ssr": "^0.5.1",
	"@supabase/supabase-js": "^2.45.4"
}
```

## Configuration Steps

### 1. Dexie Cloud Configuration File

When `npx dexie-cloud create` is executed, a `dexie-cloud.json` and `dexie-cloud.key` file are created in the project root:

```json
{
	"serviceUrl": "https://dexie.cloud",
	"dbUrl": "https://<id>.dexie.cloud"
}
```

### 2. Environment Variables

Create/update your `.env.local` file with the following variables:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Dexie Cloud Configuration
PUBLIC_DEXIE_CLOUD_DB_URL=https://<id>.dexie.cloud
DEXIE_CLOUD_CLIENT_ID=your-client-id
DEXIE_CLOUD_CLIENT_SECRET=your-client-secret
```

### 3. Database Configuration

Update `src/lib/db/index.ts` to configure Dexie Cloud:

```typescript
import Dexie, { type EntityTable } from 'dexie';
import type { BookmarkData } from '$lib/types/bookmark.js';
import dexieCloud from 'dexie-cloud-addon';
import { PUBLIC_DEXIE_CLOUD_DB_URL } from '$env/static/public';

class Database extends Dexie {
	bookmarks!: EntityTable<BookmarkData, 'id'>;

	constructor() {
		super('BookmarkManager', { addons: [dexieCloud] });
		this.version(1).stores({
			bookmarks: '@id, title, url, *tags, *keywords, isStarred, isReviewed, created, modified'
		});
	}
}

export const db = new Database();

db.cloud.configure({
	databaseUrl: PUBLIC_DEXIE_CLOUD_DB_URL,
	requireAuth: false,
	fetchTokens: (tokenParams) =>
		fetch('/dexie-cloud-tokens', {
			method: 'post',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(tokenParams)
		}).then((res) => res.json())
});
```

Notes:

- `requireAuth: false` allows the visitors to create and use an IndexDB without the need to log in or create an account.
  The sync between devices will not be available, but as soon as they register, the bookmarks from the various devices will be merged.

### 4. Token Endpoint Implementation

The token endpoint at `src/routes/dexie-cloud-tokens/+server.ts` handles the secure token exchange:

Reference Implementation: https://dexie.org/cloud/docs/db.cloud.configure()#example-integrate-custom-authentication

**Key Features:**

- Validates Supabase authentication via `locals.user`
- Uses client credentials flow with Dexie Cloud
- Maps Supabase user ID to Dexie Cloud subject claim
- Implements proper error handling and security headers

**Security Measures:**

- Requires active Supabase session
- Uses server-side client credentials (never exposed to the client)
- Sets `Cache-Control: no-store` to prevent token caching
- Validates all required environment variables
