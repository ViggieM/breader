<!-- ABOUTME: UI component for saving and displaying offline content for a bookmark -->
<!-- ABOUTME: Shows either a "Save offline" button or the extracted article content with dropdown menu -->

<script lang="ts">
	import {
		saveOfflineContentForBookmark,
		refreshOfflineContent
	} from '$lib/stores/offlineContent.svelte';
	import { getOfflineContent, deleteOfflineContent } from '$lib/db/offline';
	import { toastError, toastSuccess } from '$lib/stores/notifications.svelte';
	import type { OfflineContentData } from '$lib/types';

	interface Props {
		bookmarkId: string;
		url: string;
	}

	const { bookmarkId, url }: Props = $props();

	// Content state - loaded once on mount, updated by actions
	let offlineContent = $state<OfflineContentData | null>(null);
	let loading = $state(false);
	let refreshing = $state(false);

	// Load content on mount
	$effect(() => {
		loadContent();
	});

	async function loadContent() {
		const content = await getOfflineContent(bookmarkId);
		offlineContent = content ?? null;
	}

	async function handleSave() {
		loading = true;
		try {
			const result = await saveOfflineContentForBookmark(bookmarkId, url);
			if (result.success) {
				toastSuccess('Content saved for offline reading');
				await loadContent();
			} else {
				toastError(result.error || 'Failed to save content');
			}
		} catch (err) {
			console.error('Error saving offline content:', err);
			toastError('An unexpected error occurred');
		} finally {
			loading = false;
		}
	}

	async function handleRefresh() {
		refreshing = true;
		try {
			const result = await refreshOfflineContent(bookmarkId, url);
			if (result.success) {
				toastSuccess('Content refreshed');
				await loadContent();
			} else {
				toastError(result.error || 'Failed to refresh content');
			}
		} catch (err) {
			console.error('Error refreshing offline content:', err);
			toastError('An unexpected error occurred');
		} finally {
			refreshing = false;
		}
	}

	async function handleDelete() {
		try {
			await deleteOfflineContent(bookmarkId);
			offlineContent = null;
			toastSuccess('Offline content deleted');
		} catch (err) {
			console.error('Error deleting offline content:', err);
			toastError('Failed to delete offline content');
		}
	}
</script>

{#if offlineContent}
	<!-- Display saved content -->
	<div class="offline-content relative">
		<!-- Dropdown menu trigger -->
		<button
			class="btn btn-ghost btn-sm btn-square absolute top-0 right-0 hover:bg-base-200"
			popovertarget="offline-menu-{bookmarkId}"
			style="anchor-name:--anchor-offline-{bookmarkId}"
			aria-label="Offline content options menu"
			disabled={refreshing}
		>
			{#if refreshing}
				<span class="loading loading-spinner loading-xs"></span>
			{:else}
				<span class="icon-[ri--more-2-fill] size-4 shrink-0" aria-hidden="true"></span>
			{/if}
		</button>

		<!-- Popover menu -->
		<ul
			class="dropdown menu w-52 rounded-box bg-base-100 shadow-sm"
			popover
			id="offline-menu-{bookmarkId}"
			style="position-anchor:--anchor-offline-{bookmarkId}; inset: auto; position-area: bottom left;"
		>
			<li role="menuitem">
				<button type="button" onclick={handleRefresh} disabled={refreshing}>
					<span class="icon-[ri--refresh-line]"></span>
					Refresh content
				</button>
			</li>
			<li role="menuitem">
				<button type="button" class="text-error" onclick={handleDelete}>
					<span class="icon-[ri--delete-bin-line]"></span>
					Delete offline content
				</button>
			</li>
		</ul>

		{#if offlineContent.title}
			<h2 class="text-lg font-semibold mb-4 pr-10">{offlineContent.title}</h2>
		{/if}
		<article class="prose prose-sm max-w-none">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Readability outputs sanitized HTML -->
			{@html offlineContent.content}
		</article>
	</div>
{:else}
	<!-- Show save button -->
	<button
		role="menuitem"
		class="btn btn-sm w-full"
		onclick={handleSave}
		draggable="false"
		disabled={loading}
	>
		{#if loading}
			<span class="loading loading-spinner loading-xs"></span>
			<span class="text-xs">Saving...</span>
		{:else}
			<span class="icon-[ri--download-2-line] shrink-0" aria-hidden="true"></span>
			<span class="text-xs">Save offline</span>
		{/if}
	</button>
{/if}
