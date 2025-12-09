<script lang="ts">
	import { Bookmark, Tag, type TagData } from '$lib/types';
	import { db } from '$lib/db';
	import { invalidateAll } from '$app/navigation';
	import { liveQuery } from 'dexie';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import { tagMap } from '$lib/stores/tags.svelte.js';
	import { type ObjectOption } from 'svelte-multiselect';

	const { data } = $props();

	// Live updates from Dexie
	const liveBookmarkData = liveQuery(() => db.bookmarks.get(data.uuid));

	// Start with loaded data, then update from live query
	let bookmark: Bookmark = $state(data.bookmark);
	let isReviewed = $state(bookmark.isReviewed);

	let selectedTags = $state([]) as ObjectOption[];
	$effect(() => {
		selectedTags = bookmark.tags
			.filter((id) => $tagMap.has(id))
			.map((id) => {
				const tag = $tagMap.get(id) as Tag;
				return {
					value: tag.id,
					label: tag.getDisplayName()
				};
			});
	});

	let hasUnsavedChanges = $state(false);
	let saving = $state(false);
	let copied = $state(false);

	async function saveChanges() {
		saving = true;

		try {
			let newTagIds: string[] = [];
			// Find tags that need to be created (those without a value property)
			const newTags = selectedTags.filter(
				(opt) => !('value' in opt) || opt.value === undefined || opt.value === null
			);

			// Bulk create new tags if any exist
			if (newTags.length > 0) {
				const newTagsData = newTags.map(
					(opt) =>
						({
							name: opt.label,
							parentId: null,
							order: 0
						}) as TagData
				);

				// Bulk insert new tags and get their auto-generated IDs
				newTagIds = await db.tags.bulkAdd(newTagsData, { allKeys: true });

				// Update selectedTags with the newly created tag IDs
				newTags.forEach((opt, index) => {
					opt.value = newTagIds[index];
				});
			}

			// Collect all tag IDs: existing tags already have values, new tags now have values
			const tagsArray = selectedTags.map((option) => option.value) as string[];

			// Update the bookmark with all tag IDs
			await db.bookmarks.update(bookmark.id, {
				tags: [...tagsArray, ...newTagIds],
				modified: new Date().toISOString()
			});

			await invalidateAll();

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
		selectedTags = bookmark.tags
			.filter((id) => $tagMap.has(id))
			.map((id) => {
				const tag = $tagMap.get(id) as Tag;
				return {
					value: tag.id,
					label: tag.getDisplayName()
				};
			});
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
</script>

<svelte:head>
	<title>{$liveBookmarkData?.title} | Breader</title>
</svelte:head>

<main class="flex flex-col">
	<div class="container mx-auto max-w-2xl">
		<header class="flex items-center gap-3">
			<img src={bookmark.faviconUrl} class="size-4" alt="Favicon" />
			<h1 class="text-lg font-medium flex-1 mt-0">{$liveBookmarkData?.title}</h1>
			{#if bookmark.isStarred}
				<div class="text-warning">⭐</div>
			{/if}
		</header>

		<dl class="space-y-4 mb-4">
			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">URL</dt>
				<dd class="flex gap-2">
					<label class="input input-sm input-bordered w-full">
						<input type="text" value={bookmark.url} class="flex-1 input-sm" readonly />
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
			</div>

			<!--fixme: (low) need some nice place to put the created and modified date-->
			<!--<div>-->
			<!--	<dt class="text-sm font-medium opacity-70 mb-1">Created</dt>-->
			<!--	<dd class="text-sm">{formatDate(bookmark.created)}</dd>-->
			<!--</div>-->

			<!--{#if bookmark.modified}-->
			<!--	<div>-->
			<!--		<dt class="text-sm font-medium opacity-70 mb-1">Modified</dt>-->
			<!--		<dd class="text-sm">{formatDate(bookmark.modified)}</dd>-->
			<!--	</div>-->
			<!--{/if}-->

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

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Tags</dt>
				<TagMultiselect
					bind:selectedTags
					onAdd={checkForChanges}
					onRemove={checkForChanges}
					onRemoveAll={checkForChanges}
				></TagMultiselect>
			</div>
		</dl>
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
