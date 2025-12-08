<script lang="ts">
	import { Bookmark } from '$lib/types';
	import MultiSelectTags from '$lib/components/MultiSelectTags.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { db } from '$lib/db';
	import { invalidateAll } from '$app/navigation';
	import OvertypeEditor from '$lib/components/OvertypeEditor.svelte';
	import { liveQuery } from 'dexie';

	const { data } = $props();

	// Live updates from Dexie
	const liveBookmarkData = liveQuery(() => db.bookmarks.get(data.uuid));

	// Start with loaded data, then update from live query
	let bookmark: Bookmark = $state(data.bookmark);
	let title = $state(bookmark.title);
	let description = $state(bookmark.description);
	let isReviewed = $state(bookmark.isReviewed);

	liveBookmarkData.subscribe((value) => {
		if (value) {
			bookmark = new Bookmark(value);
			title = bookmark.title;
			description = bookmark.description;
		}
	});

	const selectedTags = new SvelteSet<string>();
	let hasUnsavedChanges = $state(false);
	let saving = $state(false);
	let initialTagsSet = $state(new Set<string>());
	// fixme: (low) multiSelectDetails only exists for closing the MultiSelectTags after saving.
	//  would be nice to have it more concentrated in one place
	let multiSelectDetails = $state() as HTMLDetailsElement;
	let copied = $state(false);

	let descriptionEditor = $state() as OvertypeEditor;

	$effect(() => {
		selectedTags.clear();
		bookmark.tags.forEach((tagId) => selectedTags.add(tagId));
		initialTagsSet = new Set(bookmark.tags);
		hasUnsavedChanges = false;
	});

	$effect(() => {
		const currentTagsSet = new Set(selectedTags);
		const hasChanges =
			title !== bookmark.title ||
			description !== bookmark.description ||
			currentTagsSet.size !== initialTagsSet.size ||
			[...currentTagsSet].some((tag) => !initialTagsSet.has(tag));
		hasUnsavedChanges = hasChanges;
	});

	async function saveChanges() {
		saving = true;
		try {
			const tagsArray = Array.from(selectedTags);
			await db.bookmarks.update(bookmark.id, {
				title: title,
				description: description,
				tags: tagsArray,
				modified: new Date().toISOString()
			});

			await invalidateAll();

			initialTagsSet = new Set(tagsArray);
			hasUnsavedChanges = false;
			if (multiSelectDetails) {
				multiSelectDetails.open = false;
			}
		} catch (error) {
			console.error('Error saving tags:', error);
		} finally {
			saving = false;
		}
	}

	function cancelChanges() {
		// reset title
		title = bookmark.title;
		// reset description
		descriptionEditor.resetEditor();
		// reset tags
		selectedTags.clear();
		initialTagsSet.forEach((tagId) => selectedTags.add(tagId));
	}

	function openUrl() {
		window.open(bookmark.url, '_blank');
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
	<title>{bookmark.title} - Breader</title>
</svelte:head>

<main class="flex flex-col">
	<div class="container mx-auto max-w-2xl">
		<header class="flex items-center gap-3">
			<img src={bookmark.faviconUrl} class="size-4" alt="Favicon" />
			<h1
				class="text-lg font-medium flex-1 mt-0"
				contenteditable="true"
				bind:innerText={title}
			></h1>
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
					<button onclick={openUrl} class="btn btn-sm btn-primary">Open</button>
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
				<dd class="text-sm">
					<MultiSelectTags {selectedTags} bind:multiSelectDetails />
				</dd>
			</div>

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Description</dt>
				<dd class="shadow">
					{#key bookmark.description}
						<OvertypeEditor
							bind:this={descriptionEditor}
							bind:content={description}
							padding="0.5rem"
						/>
					{/key}
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
