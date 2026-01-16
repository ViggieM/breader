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
	import { resolve } from '$app/paths';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';
	import { parseYouTubeUrl } from '$lib/utils/youtube';
	import YouTubeEmbed from '$lib/components/YouTubeEmbed.svelte';
	import { tick } from 'svelte';

	const { data } = $props();

	// Live updates from Dexie (intentional one-time store initialization)
	const liveData = getBookmark(data.uuid);

	// Start with loaded data, then update from live query (synced via $effect below)
	// Initial values captured from props, kept in sync via $effect
	let bookmark = $state(data.bookmark) as Bookmark;
	let status = $state(data.bookmark.status);
	let selectedTags = $state(tagIdsToOptions(data.bookmark.tags, $tagMap)) as ObjectOption[];
	let url = $state(data.bookmark.url);

	// Edit title dialog state
	let editTitleDialog = $state() as HTMLDialogElement;
	let editTitleForm = $state() as HTMLFormElement;
	let editTitleValue = $state('');
	let isEditingTitle = $state(false);
	let editTitleError = $state<string | null>(null);

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
	let disabled = $derived(saving);
	let deleteDialog = $state() as HTMLDialogElement;
	let statusDialog = $state() as HTMLDialogElement;
	let youtubeVideoInfo = $derived(parseYouTubeUrl(bookmark.url));
	let isYouTubeVideo = $derived(youtubeVideoInfo !== null);

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

	async function handleEditTitle(): Promise<void> {
		editTitleValue = bookmark.title || '';
		editTitleError = null;
		editTitleDialog?.showModal();
		await tick();
		editTitleDialog?.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
	}

	async function handleEditTitleSubmit(e: Event): Promise<void> {
		e.preventDefault();
		editTitleError = null;

		const trimmedTitle = editTitleValue.trim();

		// Validate: title should be different
		if (trimmedTitle === bookmark.title?.trim()) {
			editTitleDialog?.close();
			return;
		}

		isEditingTitle = true;
		try {
			await updateBookmarkTitle(bookmark.id, trimmedTitle);
			toastSuccess('Title updated');
			editTitleDialog?.close();
			editTitleForm?.reset();
			editTitleValue = '';
		} catch (error) {
			console.error('Failed to update title:', error);
			editTitleError = 'Failed to update title. Please try again.';
		} finally {
			isEditingTitle = false;
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
			goto(resolve('/'));
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
		<!-- YouTube embed at top -->
		{#if isYouTubeVideo && youtubeVideoInfo}
			<div>
				<YouTubeEmbed
					videoId={youtubeVideoInfo.videoId}
					title={bookmark.title || 'YouTube video'}
				/>
			</div>
		{/if}

		<!-- Header below video -->
		<header class="flex items-center">
			<img src={bookmark.faviconUrl} class="size-4 mr-3" alt="Favicon" />
			<h1 class="text-lg font-medium flex-1 mt-0">
				{bookmark.title}{#if bookmark.isStarred}
					<span class="icon-[ri--star-s-fill] text-amber-500 relative top-0.5 ml-2 shrink-0"></span>
				{/if}
			</h1>

			<div class="dropdown dropdown-bottom dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost rounded-full size-10 relative left-2">
					<span class="icon-[ri--more-2-fill] shrink-0"></span>
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu bg-base-100 rounded-box z-1 w-54 p-2 shadow-sm mt-1"
				>
					<li>
						<button onclick={handleEditTitle}>
							<span class="icon-[ri--pencil-line]"></span>
							Edit Title
						</button>
					</li>
					<li>
						<button onclick={() => statusDialog.showModal()}>
							<span class="icon-[ri--book-shelf-line]"></span>
							Change Status
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
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
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

<!-- Edit Title Dialog -->
<dialog bind:this={editTitleDialog} class="modal" aria-labelledby="edit-title-title">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
				>✕</button
			>
		</form>

		<h3 id="edit-title-title" class="text-lg font-bold">Edit Bookmark Title</h3>
		<form bind:this={editTitleForm} class="mt-4" onsubmit={handleEditTitleSubmit}>
			{#if editTitleError}
				<div class="alert alert-error mb-4">
					<span class="icon-[ri--error-warning-fill]"></span>
					<span>{editTitleError}</span>
				</div>
			{/if}
			<div class="form-group">
				<label class="input input-bordered flex items-center gap-2 w-full">
					<img src={bookmark.faviconUrl} class="size-4 shrink-0" alt="Favicon" />
					<input
						bind:value={editTitleValue}
						name="title"
						type="text"
						placeholder="Bookmark title"
						class="grow"
						disabled={isEditingTitle}
					/>
				</label>
			</div>
			<div class="mt-4 text-right">
				<button
					class="btn btn-primary"
					type="submit"
					disabled={!editTitleValue.trim() ||
						editTitleValue.trim() === bookmark.title?.trim() ||
						isEditingTitle}
				>
					{#if isEditingTitle}
						<span class="loading loading-spinner"></span>
					{/if}
					Save
				</button>
				<button
					class="btn"
					type="button"
					disabled={isEditingTitle}
					onclick={() => {
						editTitleDialog?.close();
						editTitleForm?.reset();
						editTitleError = null;
						editTitleValue = '';
					}}
				>
					Cancel
				</button>
			</div>
		</form>
	</div>
</dialog>

<!-- Change Status Dialog -->
<dialog bind:this={statusDialog} class="modal" aria-labelledby="change-status-title">
	<div class="modal-box min-h-72">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
				>✕</button
			>
		</form>

		<h3 id="change-status-title" class="text-lg font-bold mb-4">Change Status</h3>

		<BookmarkStatusSelect
			bind:status
			bind:saving
			bind:disabled
			handleClick={handleStatusClick}
			position="bottom"
			size="medium"
		/>

		<div class="modal-action mt-36">
			<button class="btn" onclick={() => statusDialog.close()}>Done</button>
		</div>
	</div>
</dialog>

<style>
	.collapse-title:after {
		left: 4rem;
		top: 0.7rem;
	}
</style>
