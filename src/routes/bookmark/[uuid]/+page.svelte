<script lang="ts">
	import { Bookmark } from '$lib/types';
	import {
		getBookmark,
		updateBookmarkTags,
		updateBookmarkStatus,
		updateBookmarkTitle,
		updateBookmarkStar,
		updateBookmarkUrl,
		deleteBookmark
	} from '$lib/db/bookmarks';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import BookmarkStatusSelect from '$lib/components/BookmarkStatusSelect.svelte';
	import BookmarkNotes from '$lib/components/BookmarkNotes.svelte';
	import { tagMap } from '$lib/stores/tags.svelte.js';
	import { type ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave, tagIdsToOptions } from '$lib/utils/tags';
	import { formatDate, formatDateAndTime } from '$lib';
	import { goto } from '$app/navigation';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

	const { data } = $props();

	// Live updates from Dexie
	const liveData = getBookmark(data.uuid);

	// Start with loaded data, then update from live query
	let bookmark = $state(data.bookmark) as Bookmark;
	let status = $state(data.bookmark.status);
	let selectedTags = $state(tagIdsToOptions(data.bookmark.tags, $tagMap)) as ObjectOption[];
	let url = $state(data.bookmark.url);
	let title = $state(data.bookmark.title ?? null);
	let isEditingTitle = $state(false);
	let titleInput = $state() as HTMLInputElement;

	$effect(() => {
		if ($liveData) {
			selectedTags = tagIdsToOptions($liveData.tags, $tagMap);
			bookmark = new Bookmark($liveData);
		}
	});

	// Focus the title input when editing mode is activated
	$effect(() => {
		if (isEditingTitle && titleInput) {
			titleInput.focus();
		}
	});

	let hasUnsavedChanges = $state(false);
	let saving = $state(false);
	let copied = $state(false);
	let detailsElement = $state<HTMLDetailsElement>();
	let disabled = $derived(saving);
	let deleteDialog = $state() as HTMLDialogElement;

	async function saveChanges() {
		saving = true;

		try {
			// Process tags: create new ones and get all tag IDs
			const { allTagIds } = await processTagsForSave(selectedTags);

			// Update the bookmark with all tag IDs (bug fixed: no duplicates!)
			await updateBookmarkTags(bookmark.id, allTagIds);

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

	async function handleStatusClick() {
		saving = true;
		try {
			await updateBookmarkStatus(bookmark.id, status);
		} catch (error) {
			console.error('Error updating status:', error);
		} finally {
			saving = false;
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

	async function handleDeleteBookmark() {
		try {
			await deleteBookmark(bookmark.id);
			toastSuccess('Bookmark deleted');
			deleteDialog.close();
			goto('/');
		} catch (error) {
			toastError('Failed to delete bookmark');
			console.error('Failed to delete bookmark:', error);
		}
	}
</script>

<svelte:head>
	<title>{bookmark.title} | Breader</title>
</svelte:head>

<main class="flex flex-col">
	<div class="container mx-auto max-w-2xl">
		<header class="flex items-center" class:px-0={isEditingTitle}>
			{#if isEditingTitle}
				<div class="w-full">
					<form
						onsubmit={async (evt) => {
							evt.preventDefault();
							await updateBookmarkTitle(bookmark.id, title);
							isEditingTitle = false;
						}}
					>
						<input type="text" bind:value={title} class="input w-full" bind:this={titleInput} />
					</form>
					<div class="mt-2">
						<button
							class="btn btn-xs btn-success"
							disabled={title === bookmark.title}
							onclick={async () => {
								await updateBookmarkTitle(bookmark.id, title);
								isEditingTitle = false;
							}}>Save</button
						>
						<button
							class="btn btn-xs btn-error"
							onclick={() => {
								isEditingTitle = false;
								title = bookmark.title ?? null;
							}}>Cancel</button
						>
					</div>
				</div>
			{:else}
				<img src={bookmark.faviconUrl} class="size-4 mr-3" alt="Favicon" />
				<h1 class="text-lg font-medium flex-1 mt-0">
					{bookmark.title}{#if bookmark.isStarred}
						<span class="icon-[ri--star-s-fill] text-amber-500 relative top-0.5 ml-2 shrink-0"
						></span>
					{/if}
				</h1>

				<div class="dropdown dropdown-bottom dropdown-end">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost rounded-full size-10 relative left-2"
					>
						<span class="icon-[ri--more-2-fill] shrink-0"></span>
					</div>
					<ul
						tabindex="-1"
						class="dropdown-content menu bg-base-100 rounded-box z-1 w-54 p-2 shadow-sm mt-1"
					>
						<li>
							<button
								onclick={() => {
									isEditingTitle = true;
								}}
							>
								<span class="icon-[ri--pencil-line]"></span>
								Edit Title
							</button>
						</li>
						{#if bookmark.isStarred}
							<li>
								<button
									onclick={async () => {
										await updateBookmarkStar(bookmark.id, false);
									}}
								>
									<span class="icon-[ri--star-off-line]"></span>
									Remove from favorites
								</button>
							</li>
						{:else}
							<li>
								<button
									onclick={async () => {
										await updateBookmarkStar(bookmark.id, true);
									}}
								>
									<span class="icon-[ri--star-line]"></span>
									Mark as favorite
								</button>
							</li>
						{/if}
						<li>
							<button
								onclick={() => {
									deleteDialog.showModal();
								}}
								class="text-error"
							>
								<span class="icon-[ri--delete-bin-line]"></span>
								Delete Bookmark
							</button>
						</li>
					</ul>
				</div>
			{/if}
		</header>

		<dl class="space-y-4 mb-4">
			<div>
				<TagMultiselect
					bind:selectedTags
					onAdd={checkForChanges}
					onRemove={checkForChanges}
					onRemoveAll={checkForChanges}
				></TagMultiselect>
			</div>

			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Status</dt>
				<dd class="w-52">
					<BookmarkStatusSelect
						bind:status
						bind:saving
						bind:disabled
						handleClick={handleStatusClick}
						position="bottom"
						size="small"
					/>
				</dd>
			</div>
		</dl>

		<details class="hidden collapse collapse-arrow overflow-visible" bind:this={detailsElement}>
			<summary class="collapse-title p-0"><h2>Details</h2></summary>
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
								await updateBookmarkUrl(bookmark.id, url);
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
						<dd class="text-sm">{formatDateAndTime(bookmark.modified)}</dd>
					</div>
				{/if}
			</div>
		</details>
	</div>

	<BookmarkNotes bookmarkId={bookmark.id} />

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

<dialog bind:this={deleteDialog} class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>

		<h3 class="text-lg font-bold">Delete Bookmark</h3>
		<p class="py-4">
			Are you sure you want to delete "<strong>{bookmark.title}</strong>"? This action cannot be
			undone.
		</p>
		<div class="modal-action">
			<button class="btn" onclick={() => deleteDialog.close()}>Cancel</button>
			<button class="btn btn-error" onclick={handleDeleteBookmark}>Delete</button>
		</div>
	</div>
</dialog>

<style>
	.collapse-title:after {
		left: 4rem;
		top: 0.7rem;
	}
</style>
