<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import {
		fetchUrlMetadata,
		MetadataFetchError,
		NetworkUnavailableError
	} from '$lib/utils/metadata';
	import { networkState } from '$lib/stores/network.svelte';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');
	let description = $state(data.articleData.description || '');
	let tags = $state('');
	let saving = $state(false);
	let isReviewed = $state(false);
	let isStarred = $state(false);
	let fetchingMetadata = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let lastFetchedUrl = $state('');
	let metadataError = $state('');
	let canFetchMetadata = $state(false);
	let metadataPromise: Promise<void> | null = null;

	async function handleMetadataFetch() {
		if (!url || url === lastFetchedUrl || fetchingMetadata || metadataPromise) {
			return;
		}

		let validUrl: URL;
		try {
			validUrl = new URL(url);
		} catch {
			return; // Invalid URL, skip metadata fetching
		}

		if (!['http:', 'https:'].includes(validUrl.protocol)) {
			return; // Only HTTP/HTTPS URLs
		}

		// Don't fetch if user has already entered a title
		if (title.trim()) {
			return;
		}

		lastFetchedUrl = url;
		fetchingMetadata = true;

		metadataPromise = (async () => {
			try {
				const metadata = await fetchUrlMetadata(url);

				// Only populate if fields are still empty (user might have typed while fetching)
				if (!title.trim() && metadata.title) {
					title = metadata.title;
				}

				if (!description.trim() && metadata.description) {
					description = metadata.description;
				}

				if (metadata.keywords.length > 0) {
					const existingTags = tags
						.split(',')
						.map((t) => t.trim())
						.filter((t) => t);
					const newKeywords = metadata.keywords.filter((k) => !existingTags.includes(k));
					if (newKeywords.length > 0) {
						tags = existingTags.concat(newKeywords).join(', ');
					}
				}
			} catch (error) {
				if (error instanceof NetworkUnavailableError) {
					metadataError = 'No internet connection - please enter details manually';
					console.warn('Network unavailable for metadata fetching');
				} else if (error instanceof MetadataFetchError) {
					console.warn('Failed to fetch metadata:', error.message);
				} else {
					console.error('Unexpected error fetching metadata:', error);
				}
			} finally {
				fetchingMetadata = false;
			}
		})();

		try {
			await metadataPromise;
		} finally {
			metadataPromise = null;
		}
	}

	// Update canFetchMetadata based on URL and network state
	$effect(() => {
		let validUrl: URL;
		try {
			validUrl = new URL(url);
			canFetchMetadata = ['http:', 'https:'].includes(validUrl.protocol) && networkState.isOnline;
		} catch {
			canFetchMetadata = false;
		}
	});

	// Auto-fetch metadata with debouncing
	$effect(() => {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Only auto-fetch if online
		if (networkState.isOnline) {
			debounceTimer = setTimeout(() => {
				handleMetadataFetch();
			}, 500);
		}

		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});

	async function _handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		saving = true;

		try {
			const id = await db.bookmarks.add({
				title: (formData.get('title') as string) || 'Untitled',
				url: formData.get('url') as string,
				description: (formData.get('description') as string) || '',
				tags: ((formData.get('tags') as string) || '')
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
				created: new Date().toISOString(),
				modified: null,
				keywords: [],
				isReviewed,
				isStarred
			});

			// navigate to the newly created bookmark
			// use replaceState to prevent browser back button from returning to this form
			await goto(`/#${id}`, { replaceState: true });
		} catch (error) {
			console.error('Error saving bookmark:', error);
		} finally {
			saving = false;
		}
	}
</script>

<form
	onsubmit={_handleSubmit}
	class="flex-1 md:flex-none space-y-4 pb-20 md:pb-4"
	id="add-bookmark"
>
	<div class="form-group">
		<label class="floating-label">
			<span>Title</span>
			<input
				name="title"
				type="text"
				bind:value={title}
				placeholder="Bookmark title"
				class="input input-md w-full"
			/>
		</label>
	</div>

	<div class="form-group">
		<label class="floating-label">
			<span>URL</span>
			<input
				name="url"
				type="text"
				bind:value={url}
				placeholder="https://example.com"
				class="input input-md w-full"
				class:pr-9={fetchingMetadata}
				required
				aria-describedby="url-status"
			/>
			{#if fetchingMetadata}
				<div class="absolute right-3 top-1.5" aria-hidden="true">
					<span class="loading loading-spinner loading-xs"></span>
				</div>
			{:else if networkState.isOffline && url}
				<div
					class="absolute right-3 top-1/2 -translate-y-1/2 tooltip tooltip-left"
					data-tip="Offline"
					aria-label="Currently offline"
				>
					<span
						class="icon-[iconify--material-symbols--wifi-off] text-warning text-sm"
						aria-hidden="true"
					></span>
				</div>
			{/if}
		</label>
		<div id="url-status" aria-live="polite" class="mt-1">
			{#if fetchingMetadata}
				<small class="text-base-content/60">Fetching page metadata...</small>
			{:else if metadataError}
				<small class="text-warning">{metadataError}</small>
			{:else if networkState.isOffline}
				<small class="text-base-content/60"
					>Offline - Please enter title and description manually</small
				>
			{:else if url && canFetchMetadata && !title.trim()}
				<small class="text-base-content/60">Click refresh button to fetch page metadata</small>
			{/if}
		</div>
	</div>

	<div class="form-group">
		<label class="floating-label">
			<span>Description</span>
			<textarea
				name="description"
				bind:value={description}
				placeholder="Description (optional)"
				rows="3"
				class="textarea input-md w-full"
			></textarea>
		</label>
		<small>This is the description shown when you click on a bookmark on the index page</small>
	</div>

	<div class="form-group">
		<label class="flex items-center gap-2 text-sm" for="reviewed-checkbox">
			<input
				id="reviewed-checkbox"
				type="checkbox"
				class="checkbox checkbox-sm"
				bind:checked={isReviewed}
			/>
			<span>Mark as reviewed</span>
		</label>
	</div>

	<div class="form-group">
		<label class="flex items-center gap-2 text-sm" for="starred-checkbox">
			<input
				id="starred-checkbox"
				type="checkbox"
				class="checkbox checkbox-sm"
				bind:checked={isStarred}
			/>
			<span>Mark as starred</span>
		</label>
	</div>

	<div class="form-group">
		<label class="floating-label">
			<span>Tags</span>
			<input
				name="tags"
				type="text"
				bind:value={tags}
				placeholder="tag1, tag2, tag3"
				class="input input-md w-full"
			/>
		</label>
		<small>Separate tags with commas</small>
	</div>
</form>

<div
	class="sticky bottom-0 left-0 right-0 p-2 md:static md:p-0 bg-base-100 border-t border-base-300 md:border-0"
	style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
>
	<div class="form-actions flex gap-2">
		<a href="/" type="button" class="btn btn-error flex-1 md:flex-none"> Cancel </a>
		<button
			type="submit"
			disabled={saving || !url}
			class="btn btn-success flex-1 md:flex-none"
			form="add-bookmark"
		>
			{saving ? 'Saving...' : 'Save Bookmark'}
		</button>
	</div>
</div>
