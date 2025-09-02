<script lang="ts">
	import type { Bookmark } from '$lib/types';
	import { formatDate } from '$lib';
	import MultiSelectTags from '$lib/components/MultiSelectTags.svelte';
	import { tagsData } from '$lib/stores/search.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { db } from '$lib/db';

	const { data } = $props();
	const bookmark: Bookmark = data.bookmark;

	const selectedTags = new SvelteSet<string>();
	let hasUnsavedChanges = $state(false);
	let saving = $state(false);
	let initialTagsSet = $state(new Set<string>());

	$effect(() => {
		selectedTags.clear();
		bookmark.tags.forEach((tagId) => selectedTags.add(tagId));
		initialTagsSet = new Set(bookmark.tags);
		hasUnsavedChanges = false;
	});

	$effect(() => {
		const currentTagsSet = new Set(selectedTags);
		const hasChanges =
			currentTagsSet.size !== initialTagsSet.size ||
			[...currentTagsSet].some((tag) => !initialTagsSet.has(tag));
		hasUnsavedChanges = hasChanges;
	});

	async function saveTags() {
		saving = true;
		try {
			const tagsArray = Array.from(selectedTags);
			await db.bookmarks.update(bookmark.id, {
				tags: tagsArray,
				modified: new Date().toISOString()
			});

			initialTagsSet = new Set(tagsArray);
			hasUnsavedChanges = false;
		} catch (error) {
			console.error('Error saving tags:', error);
		} finally {
			saving = false;
		}
	}

	function cancelTagChanges() {
		selectedTags.clear();
		initialTagsSet.forEach((tagId) => selectedTags.add(tagId));
		hasUnsavedChanges = false;
	}

	function openUrl() {
		window.open(bookmark.url, '_blank');
	}
</script>

<svelte:head>
	<title>{bookmark.title} - Breader</title>
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
				<dt class="text-sm font-medium opacity-70 mb-1">URL</dt>
				<dd class="flex gap-2">
					<input
						type="text"
						value={bookmark.url}
						class="input input-sm input-bordered flex-1"
						readonly
					/>
					<button onclick={openUrl} class="btn btn-sm btn-primary">Open</button>
				</dd>
			</div>

			{#if bookmark.description}
				<div>
					<dt class="text-sm font-medium opacity-70 mb-1">Description</dt>
					<dd class="text-sm opacity-75 break-words">{bookmark.description}</dd>
				</div>
			{/if}

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

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Status</dt>
				<dd>
					<div class="badge {bookmark.isReviewed ? 'badge-success' : 'badge-warning'}">
						{bookmark.isReviewed ? 'Reviewed' : 'Unreviewed'}
					</div>
				</dd>
			</div>

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Tags</dt>
				<dd class="text-sm">
					<MultiSelectTags tags={$tagsData} {selectedTags} />
				</dd>
			</div>
		</dl>
	</div>

	{#if hasUnsavedChanges}
		<div
			class="sticky left-0 bottom-0 mt-auto md:mt-4 pt-2 md:static bg-base-100 border-t border-base-300 md:border-0"
			style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
		>
			<div class="form-actions flex gap-2">
				<button type="button" onclick={cancelTagChanges} class="btn btn-error flex-1 md:flex-none">
					Cancel
				</button>
				<button
					type="button"
					disabled={saving}
					onclick={saveTags}
					class="btn btn-success flex-1 md:flex-none"
				>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	{/if}
</main>
