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
	import { createNote, updateNote, deleteNote as deleteNoteFromDb } from '$lib/db/notes';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import BookmarkStatusSelect from '$lib/components/BookmarkStatusSelect.svelte';
	import Note from '$lib/components/Note.svelte';
	import { tagMap } from '$lib/stores/tags.svelte.js';
	import { createBookmarkNotesStore } from '$lib/stores/bookmarkNotes.svelte.js';
	import { type ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave, tagIdsToOptions } from '$lib/utils/tags';
	import { formatDateAndTime } from '$lib';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toastSuccess, toastError, toastWarning } from '$lib/stores/notifications.svelte';
	import { parseYouTubeUrl } from '$lib/utils/youtube';
	import YouTubeEmbed from '$lib/components/YouTubeEmbed.svelte';
	import { tick, untrack } from 'svelte';

	const { data } = $props();

	// Live updates from Dexie (intentional one-time store initialization)
	const liveData = getBookmark(untrack(() => data.uuid));

	// Start with loaded data, then update from live query (synced via $effect below)
	// Initial values captured from props, kept in sync via $effect
	let bookmark = $state(untrack(() => data.bookmark)) as Bookmark;
	let status = $state(untrack(() => data.bookmark.status));
	let selectedTags = $state(
		untrack(() => tagIdsToOptions(data.bookmark.tags, $tagMap))
	) as ObjectOption[];
	let url = $state(untrack(() => data.bookmark.url));

	// Notes store initialization (intentional one-time capture for store creation)
	const notesStore = createBookmarkNotesStore(untrack(() => data.uuid));
	let notes = $derived($notesStore);
	let sortedNotes = $derived([...notes].sort((a, b) => b.created.localeCompare(a.created)));

	// Track newly created notes for auto-opening and focusing
	let newlyCreatedNoteId = $state<string | null>(null);

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

	let shareSuccess = $state(false);
	async function handleShare(): Promise<void> {
		try {
			if (navigator.share) {
				// Use Web Share API on mobile/supported browsers
				await navigator.share({
					title: bookmark.title || 'Untitled',
					url: bookmark.url
				});
			} else {
				// Fallback to clipboard on desktop
				await navigator.clipboard.writeText(bookmark.url);
				toastSuccess('Copied to Clipboard');
				shareSuccess = true;
				setTimeout(() => {
					shareSuccess = false;
				}, 2000);
			}
		} catch (error) {
			// User canceled share or clipboard failed
			console.error('Share failed:', error);
		}
	}

	function handleOpen(): void {
		window.open(bookmark.url, '_blank', 'noopener,noreferrer');
	}

	function handleSaveOffline(): void {
		toastWarning('This feature is not implemented (yet)');
	}

	let infoOpen = $state(false);
	function handleInfo(): void {
		infoOpen = !infoOpen;
	}

	// Note management functions
	async function addNote() {
		try {
			const noteId = await createNote(bookmark.id, '');
			toastSuccess('Note created');
			newlyCreatedNoteId = noteId; // Track newly created note
		} catch (error) {
			toastError('Failed to create note');
			console.error('Failed to create note:', error);
		}
	}

	async function saveNote(noteId: string, newText: string, newTitle: string | null) {
		try {
			await updateNote(noteId, newText, newTitle);
			toastSuccess('Note updated');
		} catch (error) {
			toastError('Failed to update note');
			console.error('Failed to save note:', error);
			throw error; // Re-throw so Note component can handle it
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await deleteNoteFromDb(noteId);
			toastSuccess('Note deleted');
		} catch (error) {
			toastError('Failed to delete note');
			console.error('Failed to delete note:', error);
			throw error; // Re-throw so Note component can handle it
		}
	}

	// Auto-open and focus newly created notes
	$effect(() => {
		// Check if we have a newly created note and it's been rendered
		if (newlyCreatedNoteId && sortedNotes.some((n) => n.id === newlyCreatedNoteId)) {
			tick().then(() => {
				// Find the note's details element
				const noteElement = document.getElementById(
					`note-${newlyCreatedNoteId}`
				) as HTMLDetailsElement;
				if (noteElement) {
					// Open the details element
					noteElement.open = true;

					// Focus the editor inside - try multiple selectors for the overtype editor
					const editorDiv = noteElement.querySelector('[contenteditable], textarea, .ot-editor');
					if (editorDiv instanceof HTMLElement) {
						editorDiv.focus();
					}
				}
				// Clear tracking to prevent repeated focus attempts
				newlyCreatedNoteId = null;
			});
		}
	});
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
			<div class="relative">
				<TagMultiselect
					bind:selectedTags
					onAdd={checkForChanges}
					onRemove={checkForChanges}
					onRemoveAll={checkForChanges}
				></TagMultiselect>

				{#if hasUnsavedChanges}
					<div class="mt-4 w-full">
						<div class="form-actions flex gap-2 w-full">
							<button
								type="button"
								disabled={saving}
								onclick={saveChanges}
								class="btn btn-sm btn-success flex-1"
								aria-label={saving ? 'Saving...' : 'Save Changes'}
							>
								<span class="icon-[ri--check-fill]"></span>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
							<button type="button" onclick={cancelChanges} class="btn btn-sm btn-error flex-1">
								<span class="icon-[ri--close-fill]"></span>
								Cancel
							</button>
						</div>
					</div>
				{/if}
			</div>
		</dl>

		<div role="menu" class="mt-8 grid grid-cols-3 gap-2 text-base-content">
			<button
				role="menuitem"
				class={['btn btn-sm', infoOpen && 'btn btn-primary btn-sm']}
				onclick={handleInfo}
				draggable="false"
			>
				<span class="icon-[ri--information-2-line] shrink-0" aria-hidden="true"></span>
				<span class="text-xs">Info</span>
			</button>
			<button
				role="menuitem"
				class="btn btn-sm"
				onclick={handleShare}
				draggable="false"
				class:btn-success={shareSuccess}
			>
				<span
					class={shareSuccess
						? 'icon-[ri--check-line] shrink-0'
						: 'icon-[ri--share-forward-line] shrink-0'}
					aria-hidden="true"
				></span>
				<span class="text-xs">{shareSuccess ? 'Copied URL' : 'Share'}</span>
			</button>
			<button role="menuitem" class="btn btn-sm" onclick={handleOpen} draggable="false">
				<span class="icon-[ri--external-link-line] shrink-0" aria-hidden="true"></span>
				<span class="text-xs">Open</span>
			</button>
		</div>

		<div class="overflow-x-auto mt-4" class:hidden={!infoOpen}>
			<table class="table table-sm">
				<tbody>
					<tr>
						<th class="w-1 whitespace-nowrap">Created</th>
						<td>{formatDateAndTime(bookmark.created)}</td>
					</tr>
					<tr>
						<th class="w-1 whitespace-nowrap">Modified</th>
						<td>{bookmark.modified ? formatDateAndTime(bookmark.modified) : '-'}</td>
					</tr>
					<tr>
						<th class="w-1 whitespace-nowrap">URL</th>
						<td
							><label class="input input-xs input-ghost w-full p-0">
								<input type="text" bind:value={url} class="flex-1 input-sm" />
							</label>
						</td>
					</tr>
				</tbody>
			</table>
			{#if url !== bookmark.url}
				<div class="flex gap-2 pb-2">
					<button
						class="btn btn-sm grow btn-success mt-3"
						type="button"
						onclick={async () => {
							await updateBookmarkUrl(bookmark.id, url);
						}}>Save</button
					>
					<button
						class="btn btn-sm grow btn-error mt-3"
						type="button"
						onclick={() => {
							url = bookmark.url;
						}}>Cancel</button
					>
				</div>
			{/if}
		</div>
	</div>

	<!-- Notes section -->
	<section class="mt-6">
		{#if sortedNotes.length == 0}
			<p class="p-2 bg-base-200 text-sm italic text-center">No notes</p>
		{:else}
			<ul class="space-y-1">
				{#each sortedNotes as note (note.id)}
					<li><Note {note} onSave={saveNote} onDelete={deleteNote} /></li>
				{/each}
			</ul>
		{/if}

		<div class="mt-2">
			<button role="menuitem" class="btn btn-sm btn-ghost" onclick={addNote} draggable="false">
				<span class="icon-[ri--add-fill]" aria-hidden="true"></span>
				<span class="text-xs">Note</span>
			</button>
		</div>
	</section>

	<!-- Offline -->
	<div class="h-full flex items-end py-4">
		<button
			role="menuitem"
			class="btn btn-sm w-full"
			onclick={handleSaveOffline}
			draggable="false"
			disabled
		>
			<span class="icon-[ri--download-2-line] shrink-0" aria-hidden="true"></span>
			<span class="text-xs">Save offline</span>
		</button>
	</div>
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
