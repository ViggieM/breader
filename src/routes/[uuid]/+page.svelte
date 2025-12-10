<script lang="ts">
	import { Bookmark } from '$lib/types';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import { tagMap } from '$lib/stores/tags.svelte.js';
	import { type ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave, tagIdsToOptions } from '$lib/utils/tags';
	import { formatDate } from '$lib';

	const { data } = $props();

	// Live updates from Dexie
	const liveData = liveQuery(() => db.bookmarks.get(data.uuid));

	// Start with loaded data, then update from live query
	let bookmark = $state(data.bookmark) as Bookmark;
	let isReviewed = $state(data.bookmark.isReviewed);
	let selectedTags = $state(tagIdsToOptions(data.bookmark.tags, $tagMap)) as ObjectOption[];
	let url = $state(data.bookmark.url);

	$effect(() => {
		if ($liveData) {
			selectedTags = tagIdsToOptions($liveData.tags, $tagMap);
			bookmark = new Bookmark($liveData);
		}
	});

	let hasUnsavedChanges = $state(false);
	let saving = $state(false);
	let copied = $state(false);
	let detailsElement = $state<HTMLDetailsElement>();

	async function saveChanges() {
		saving = true;

		try {
			// Process tags: create new ones and get all tag IDs
			const { allTagIds } = await processTagsForSave(selectedTags);

			// Update the bookmark with all tag IDs (bug fixed: no duplicates!)
			await db.bookmarks.update(bookmark.id, {
				tags: allTagIds,
				modified: new Date().toISOString()
			});

			hasUnsavedChanges = false;
		} catch (error) {
			console.error('Error saving tags:', error);
		} finally {
			saving = false;
		}
	}

	function checkForChanges() {
		// Check if there are any new tags without a value (to be created on save)
		const hasNewTags = selectedTags.some(
			(option) => option.value === undefined || option.value === null
		);

		// If there are new tags, there are definitely unsaved changes
		if (hasNewTags) {
			hasUnsavedChanges = true;
			return;
		}

		// Compare current selectedTags with original bookmark tags
		const currentTagIds = selectedTags.map((option) => option.value).sort();
		const originalTagIds = [...bookmark.tags].sort();

		// Check if arrays are different
		const tagsChanged =
			currentTagIds.length !== originalTagIds.length ||
			currentTagIds.some((id, index) => id !== originalTagIds[index]);

		hasUnsavedChanges = tagsChanged;
	}

	function cancelChanges() {
		// reset tags
		selectedTags = tagIdsToOptions(bookmark.tags, $tagMap);
		hasUnsavedChanges = false;
	}

	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(bookmark.url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (error) {
			console.error('Failed to copy URL:', error);
		}
	}

	// Close details when clicking outside
	$effect(() => {
		if (!detailsElement) return;

		function handleClickOutside(event: MouseEvent) {
			if (detailsElement && !detailsElement.contains(event.target as Node) && detailsElement.open) {
				detailsElement.open = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<svelte:head>
	<title>{bookmark.title} | Breader</title>
</svelte:head>

<main class="flex flex-col">
	<div class="container mx-auto max-w-2xl">
		<header class="flex items-center gap-3">
			<img src={bookmark.faviconUrl} class="size-4" alt="Favicon" />
			<h1 class="text-lg font-medium flex-1 mt-0">{bookmark.title}</h1>
			{#if bookmark.isStarred}
				<div class="text-warning">⭐</div>
			{/if}
		</header>

		<dl class="space-y-4 mb-4">
			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Tags</dt>
				<TagMultiselect
					bind:selectedTags
					onAdd={checkForChanges}
					onRemove={checkForChanges}
					onRemoveAll={checkForChanges}
				></TagMultiselect>
			</div>

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Status</dt>
				<dd>
					<button
						class="badge cursor-pointer {isReviewed ? 'badge-success' : 'badge-warning'}"
						onclick={() => {
							db.bookmarks.update(bookmark.id, {
								isReviewed: !isReviewed
							});
							isReviewed = !isReviewed;
						}}
					>
						{isReviewed ? 'Reviewed' : 'Unreviewed'}
					</button>
				</dd>
			</div>
		</dl>

		<details class="collapse collapse-arrow overflow-visible" bind:this={detailsElement}>
			<summary class="collapse-title text-sm p-0">Details</summary>
			<div class="collapse-content space-y-4 p-0 mt-2">
				<div>
					<dt class="text-sm font-medium opacity-70 mb-1">URL</dt>
					<dd class="flex gap-2">
						<label class="input input-sm input-bordered w-full">
							<input type="text" bind:value={url} class="flex-1 input-sm" />
							<button
								onclick={copyUrl}
								class="opacity-50 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
								class:text-success={copied}
								>Copy URL
								<div
									class="{copied
										? 'icon-[material-symbols--check] '
										: 'icon-[material-symbols--content-copy]'} size-4"
								></div>
							</button>
						</label>
						<a href={bookmark.url} target="_blank" class="btn btn-sm btn-primary">Open</a>
					</dd>
					{#if url !== bookmark.url}
						<button
							class="btn btn-xs btn-success mt-3"
							type="button"
							onclick={async () => {
								await db.bookmarks.update(bookmark.id, {
									url: url,
									modified: new Date().toISOString()
								});
							}}>Save</button
						>
					{/if}
				</div>
				<div>
					<dt class="text-sm font-medium opacity-70 mb-1">Created</dt>
					<dd class="text-sm">{formatDate(bookmark.created)}</dd>
				</div>

				{#if bookmark.modified}
					<div>
						<dt class="text-sm font-medium opacity-70 mb-1">Modified</dt>
						<dd class="text-sm">{formatDate(bookmark.modified)}</dd>
					</div>
				{/if}
			</div>
		</details>
	</div>

	{#if hasUnsavedChanges}
		<div
			class="sticky left-0 bottom-0 mt-auto md:mt-4 pt-2 md:static bg-base-100 border-t border-base-300 md:border-0"
			style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
		>
			<div class="form-actions flex gap-2">
				<button type="button" onclick={cancelChanges} class="btn btn-error flex-1 md:flex-none">
					Cancel
				</button>
				<button
					type="button"
					disabled={saving}
					onclick={saveChanges}
					class="btn btn-success flex-1 md:flex-none"
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	{/if}
</main>

<style>
	.collapse-title {
		padding-left: 20px;
	}
	.collapse-title:after {
		left: 0;
		top: 10px;
	}
</style>
