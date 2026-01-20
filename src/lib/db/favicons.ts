// ABOUTME: Database helper functions for querying and managing favicons in the Dexie database
// ABOUTME: Provides domain-level favicon caching with retry logic for failed fetches

import Dexie from 'dexie';
import { db } from '$lib/db';
import type { FaviconData } from '$lib/types';

const { liveQuery } = Dexie;

/** 7 days in milliseconds for retry window */
const RETRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Get a favicon by domain.
 * Returns undefined if not found in the cache.
 *
 * @param domain - The domain hostname (e.g., "github.com")
 * @returns Promise that resolves to FaviconData or undefined if not found
 */
export async function getFaviconByDomain(domain: string): Promise<FaviconData | undefined> {
	return await db.favicons.where('domain').equals(domain).first();
}

/**
 * Save or update a favicon for a domain.
 * Uses put() to upsert - creates if not exists, updates if exists.
 *
 * @param domain - The domain hostname
 * @param data - The base64 data URI, or null if fetch failed
 * @param failed - Whether the favicon fetch failed
 * @param failedReason - Reason for failure ("too_large" | "fetch_error" | "invalid_image")
 * @returns Promise that resolves when the save is complete
 */
export async function saveFavicon(
	domain: string,
	data: string | null,
	failed: boolean,
	failedReason?: string
): Promise<void> {
	const now = new Date().toISOString();

	// Check if record already exists
	const existing = await getFaviconByDomain(domain);

	if (existing) {
		// Update existing record
		await db.favicons.update(existing.id, {
			data,
			failed,
			failedReason: failedReason ?? null,
			modifiedAt: now
		});
	} else {
		// Create new record (let Dexie auto-generate the id)
		await db.favicons.add({
			domain,
			data,
			failed,
			failedReason: failedReason ?? null,
			createdAt: now,
			modifiedAt: now
		} as FaviconData);
	}
}

/**
 * Check if a failed favicon should be retried.
 * Returns true if the favicon failed more than 7 days ago.
 *
 * @param favicon - The favicon data to check
 * @returns boolean indicating whether retry should be attempted
 */
export function shouldRetryFavicon(favicon: FaviconData): boolean {
	if (!favicon.failed) {
		return false;
	}

	const modifiedTime = new Date(favicon.modifiedAt).getTime();
	const now = Date.now();

	return now - modifiedTime > RETRY_WINDOW_MS;
}

/**
 * Get all favicons using liveQuery (for debugging/admin purposes).
 * Returns a Dexie Observable that reactively updates when favicons change.
 *
 * @returns Observable that emits FaviconData[] sorted by domain
 */
export function getAllFavicons() {
	return liveQuery(async () => {
		const favicons = await db.favicons.toArray();
		return favicons.sort((a, b) => a.domain.localeCompare(b.domain));
	});
}

/**
 * Delete a favicon from the cache.
 *
 * @param domain - The domain to delete the favicon for
 * @returns Promise that resolves when the deletion is complete
 */
export async function deleteFavicon(domain: string): Promise<void> {
	const existing = await getFaviconByDomain(domain);
	if (existing) {
		await db.favicons.delete(existing.id);
	}
}

/**
 * Extract domain from a URL.
 * Returns empty string if URL is invalid.
 *
 * @param url - The URL to extract domain from
 * @returns The domain hostname or empty string
 */
export function extractDomain(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}
