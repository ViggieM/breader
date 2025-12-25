<!-- ABOUTME: Main navigation menu component that displays favorites, archive, notes, untagged bookmarks, -->
<!-- ABOUTME: and hierarchical tag structure with collapsible sections and nested bookmarks -->

<script lang="ts">
	import TagMenuItem from './TagMenuItem.svelte';
	import { updateTagParent, updateTagName, deleteTag } from '$lib/db/tags';
	import { updateBookmarkTitle, deleteBookmark } from '$lib/db/bookmarks';
	import { toastSuccess } from '$lib/stores/notifications.svelte';
	import { tick } from 'svelte';
	import TagMenuBookmark from './TagMenuBookmark.svelte';
	import { dragState } from '$lib/stores/dragState.svelte';
	import type { NavigationData } from '$lib/stores/tags.svelte';
	import type { Readable } from 'svelte/store';
	import { db } from '$lib/db';
	import { browser } from '$app/environment';

	interface Props {
		bookmarksLiveData: Readable<NavigationData>;
		class?: string;
		hideTagsWithoutBookmarks: boolean;
	}

	let {
		bookmarksLiveData,
		class: className,
		hideTagsWithoutBookmarks = $bindable()
	}: Props = $props();

	const dragHelpId = 'bookmark-drag-help';
	let currentlyDragedOver = $state<HTMLElement | undefined>();

	// Edit tag dialog state
	let editTagDialog = $state<HTMLDialogElement>();
	let editTagForm = $state<HTMLFormElement>();
	let editTagName = $state('');
	let isEditingTag = $state(false);
	let editTagError = $state<string | null>(null);

	// Delete tag dialog state
	let deleteTagDialog = $state<HTMLDialogElement>();
	let isDeletingTag = $state(false);
	let deleteTagError = $state<string | null>(null);

	// Current tag being edited/deleted
	let currentTag = $state<{
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	} | null>(null);

	// Edit bookmark dialog state
	let editBookmarkDialog = $state<HTMLDialogElement>();
	let editBookmarkForm = $state<HTMLFormElement>();
	let editBookmarkTitle = $state('');
	let isEditingBookmark = $state(false);
	let editBookmarkError = $state<string | null>(null);

	// Delete bookmark dialog state
	let deleteBookmarkDialog = $state<HTMLDialogElement>();
	let isDeletingBookmark = $state(false);

	// Current bookmark being edited/deleted
	let currentBookmark = $state<{
		id: string;
		title: string | null;
		faviconUrl: string;
	} | null>(null);

	async function handleEditTag(tag: {
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	}): Promise<void> {
		currentTag = tag;
		editTagName = tag.name;
		editTagError = null;
		editTagDialog?.showModal();
		await tick();
		editTagDialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
	}

	async function handleEditTagSubmit(e: Event): Promise<void> {
		e.preventDefault();
		editTagError = null;

		if (!currentTag) return;

		const trimmedName = editTagName.trim();

		// Validate: name should not be empty and should be different
		if (!trimmedName || trimmedName === currentTag.name) {
			editTagDialog?.close();
			return;
		}

		// Additional validation
		if (trimmedName.length > 100) {
			editTagError = 'Tag name must be 100 characters or less';
			return;
		}

		isEditingTag = true;
		try {
			await updateTagName(currentTag.id, trimmedName);
			editTagDialog?.close();
			editTagForm?.reset();
			editTagName = '';
			currentTag = null;
		} catch (error) {
			console.error('Failed to rename tag:', error);
			editTagError = 'Failed to rename tag. Please try again.';
		} finally {
			isEditingTag = false;
		}
	}

	async function handleEditBookmark(bookmark: {
		id: string;
		title: string | null;
		faviconUrl: string;
	}): Promise<void> {
		currentBookmark = bookmark;
		editBookmarkTitle = bookmark.title || '';
		editBookmarkError = null;
		editBookmarkDialog?.showModal();
		await tick();
		editBookmarkDialog?.querySelector<HTMLInputElement>('input[name="title"]')?.focus();
	}

	async function handleEditBookmarkSubmit(e: Event): Promise<void> {
		e.preventDefault();
		editBookmarkError = null;

		if (!currentBookmark) return;

		const trimmedTitle = editBookmarkTitle.trim();

		// Validate: title should be different
		if (trimmedTitle === currentBookmark.title?.trim()) {
			editBookmarkDialog?.close();
			return;
		}

		isEditingBookmark = true;
		try {
			await updateBookmarkTitle(currentBookmark.id, trimmedTitle);
			editBookmarkDialog?.close();
			editBookmarkForm?.reset();
			editBookmarkTitle = '';
			currentBookmark = null;
		} catch (error) {
			console.error('Failed to update title:', error);
			editBookmarkError = 'Failed to update title. Please try again.';
		} finally {
			isEditingBookmark = false;
		}
	}

	function handleDeleteBookmark(bookmark: {
		id: string;
		title: string | null;
		faviconUrl: string;
	}): void {
		currentBookmark = bookmark;
		deleteBookmarkDialog?.showModal();
	}

	async function handleDeleteBookmarkConfirm(): Promise<void> {
		if (!currentBookmark) return;

		isDeletingBookmark = true;
		try {
			await deleteBookmark(currentBookmark.id);
			deleteBookmarkDialog?.close();
			toastSuccess(`Deleted "${currentBookmark.title || 'Untitled'}"`);
			currentBookmark = null;
		} catch (error) {
			console.error('Failed to delete bookmark:', error);
		} finally {
			isDeletingBookmark = false;
		}
	}

	function handleDeleteClick(tag: {
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	}): void {
		currentTag = tag;
		deleteTagError = null;
		deleteTagDialog?.showModal();
	}

	function handleDeleteCancel(): void {
		deleteTagError = null;
		deleteTagDialog?.close();
		currentTag = null;
	}

	async function handleDeleteConfirm(): Promise<void> {
		deleteTagError = null;

		if (!currentTag) return;

		isDeletingTag = true;
		try {
			await deleteTag(currentTag.id);
			deleteTagDialog?.close();
			currentTag = null;
		} catch (error) {
			console.error('Failed to delete tag:', error);
			deleteTagError = 'Failed to delete tag. Please try again.';
		} finally {
			isDeletingTag = false;
		}
	}
</script>

{#if $bookmarksLiveData}
	<span id={dragHelpId} class="sr-only">Drag bookmarks to tags to add that tag</span>
	<span id="tag-drag-help" class="sr-only">
		Drag tags to reorganize the hierarchy. Drop on another tag to make it a child, or drop in the
		space above the tags to make it a root-level tag.
	</span>
	<span id="bookmark-actions-help" class="sr-only">
		Expand bookmark to access notes, edit, share, and open actions
	</span>
	<ul class={['menu w-full px-0 py-4', className]}>
		<!-- Untagged bookmarks section -->
		{#each $bookmarksLiveData.untagged as bookmark (bookmark.id)}
			<TagMenuBookmark
				{bookmark}
				onEditBookmark={handleEditBookmark}
				onDeleteBookmark={handleDeleteBookmark}
			/>
		{/each}

		<!-- Tag tree with nested tags and bookmarks -->
		{#each $bookmarksLiveData.tagTree as tagNode (tagNode.tag.id)}
			{#if !hideTagsWithoutBookmarks || tagNode.hasBookmarks}
				<TagMenuItem
					node={tagNode}
					onEditTag={handleEditTag}
					onDeleteTag={handleDeleteClick}
					onEditBookmark={handleEditBookmark}
					onDeleteBookmark={handleDeleteBookmark}
					{hideTagsWithoutBookmarks}
				/>
			{/if}
		{/each}

		<!-- Empty state -->
		{#if !browser}
			<li class="py-4 text-base-content/60">
				<p>Loading Bookmarks</p>
			</li>
		{:else if $bookmarksLiveData.tagTree.length === 0 && $bookmarksLiveData.untagged.length === 0}
			{#await db.bookmarks.count()}
				<li class="py-4 text-base-content/60">
					<p>Loading Bookmarks</p>
				</li>
			{:then count}
				{#if count > 0}
					<li class="py-4 text-base-content/60">
						<p>Loading Bookmarks</p>
					</li>
				{:else}
					<li class="py-4 text-base-content/60">
						<p>No bookmarks</p>
					</li>
				{/if}
			{/await}
		{/if}
	</ul>

	<!-- Edit Tag Dialog -->
	<dialog bind:this={editTagDialog} class="modal" aria-labelledby="edit-tag-title">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
					>✕</button
				>
			</form>

			<h3 id="edit-tag-title" class="text-lg font-bold">Edit Tag</h3>
			<form bind:this={editTagForm} class="mt-4" onsubmit={handleEditTagSubmit}>
				{#if editTagError}
					<div class="alert alert-error mb-4">
						<span class="icon-[ri--error-warning-fill]"></span>
						<span>{editTagError}</span>
					</div>
				{/if}
				<div class="form-group">
					<label class="input input-bordered flex items-center gap-2 w-full">
						<span class="icon-[ri--price-tag-3-fill] shrink-0"></span>
						<input
							bind:value={editTagName}
							name="name"
							type="text"
							placeholder="Tag name"
							required
							maxlength="100"
							class="grow"
							disabled={isEditingTag}
						/>
					</label>
				</div>
				<div class="mt-4 text-right">
					<button
						class="btn btn-primary"
						type="submit"
						disabled={!editTagName.trim() ||
							(currentTag && editTagName.trim() === currentTag.name) ||
							isEditingTag}
					>
						{#if isEditingTag}
							<span class="loading loading-spinner"></span>
						{/if}
						Save
					</button>
					<button
						class="btn"
						type="button"
						disabled={isEditingTag}
						onclick={() => {
							editTagDialog?.close();
							editTagForm?.reset();
							editTagError = null;
							currentTag = null;
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</dialog>

	<!-- Edit Bookmark Dialog -->
	<dialog bind:this={editBookmarkDialog} class="modal" aria-labelledby="edit-bookmark-title">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
					>✕</button
				>
			</form>

			<h3 id="edit-bookmark-title" class="text-lg font-bold">Edit Bookmark Title</h3>
			<form bind:this={editBookmarkForm} class="mt-4" onsubmit={handleEditBookmarkSubmit}>
				{#if editBookmarkError}
					<div class="alert alert-error mb-4">
						<span class="icon-[ri--error-warning-fill]"></span>
						<span>{editBookmarkError}</span>
					</div>
				{/if}
				<div class="form-group">
					<label class="input input-bordered flex items-center gap-2 w-full">
						<span class="icon-[ri--edit-line] shrink-0"></span>
						<input
							bind:value={editBookmarkTitle}
							name="title"
							type="text"
							placeholder="Bookmark title"
							class="grow"
							disabled={isEditingBookmark}
						/>
					</label>
				</div>
				<div class="mt-4 text-right">
					<button
						class="btn btn-primary"
						type="submit"
						disabled={!editBookmarkTitle.trim() ||
							(currentBookmark && editBookmarkTitle.trim() === currentBookmark.title?.trim()) ||
							isEditingBookmark}
					>
						{#if isEditingBookmark}
							<span class="loading loading-spinner"></span>
						{/if}
						Save
					</button>
					<button
						class="btn"
						type="button"
						disabled={isEditingBookmark}
						onclick={() => {
							editBookmarkDialog?.close();
							editBookmarkForm?.reset();
							editBookmarkError = null;
							currentBookmark = null;
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</dialog>

	<!-- Delete Bookmark Confirmation Dialog -->
	<dialog bind:this={deleteBookmarkDialog} class="modal" aria-labelledby="delete-bookmark-title">
		<div class="modal-box">
			{#if currentBookmark}
				<h3 id="delete-bookmark-title">
					<div class="flex items-center gap-3">
						<img src={currentBookmark.faviconUrl} class="size-4 shrink-0" alt="Favicon" />
						<span class="font-medium truncate">{currentBookmark.title || 'Untitled'}</span>
					</div>
				</h3>
				<p class="py-4">
					Are you sure you want to delete this bookmark? This action cannot be undone.
				</p>
			{/if}
			<div class="modal-action">
				<button
					type="button"
					class="btn"
					onclick={() => {
						deleteBookmarkDialog?.close();
						currentBookmark = null;
					}}
					disabled={isDeletingBookmark}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-error"
					onclick={handleDeleteBookmarkConfirm}
					disabled={isDeletingBookmark}
				>
					{#if isDeletingBookmark}
						<span class="loading loading-spinner"></span>
					{/if}
					Delete
				</button>
			</div>
		</div>
	</dialog>

	<!-- Delete Tag Confirmation Dialog -->
	<dialog bind:this={deleteTagDialog} class="modal" aria-labelledby="delete-tag-title">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
					>✕</button
				>
			</form>

			<h3 id="delete-tag-title" class="text-lg font-bold">Delete Tag</h3>
			{#if currentTag}
				<div class="mt-4">
					{#if deleteTagError}
						<div class="alert alert-error mb-4">
							<span class="icon-[ri--error-warning-fill]"></span>
							<span>{deleteTagError}</span>
						</div>
					{/if}
					<div class="alert alert-warning">
						<span class="icon-[ri--alert-fill]"></span>
						<div class="flex flex-col gap-2">
							<p>
								Are you sure you want to delete the tag <strong>{currentTag.name}</strong>?
							</p>
							<ul class="list-disc list-inside text-sm">
								<li>This tag will be removed from all bookmarks</li>
								{#if currentTag.parentId}
									<li>Bookmarks will receive the parent tag instead</li>
								{/if}
								{#if currentTag.childrenCount > 0}
									<li>
										Child tags will be reassigned to {currentTag.parentId
											? 'the parent tag'
											: 'root level'}
									</li>
								{/if}
							</ul>
						</div>
					</div>
				</div>
			{/if}
			<div class="mt-4 text-right">
				<button
					class="btn btn-error"
					type="button"
					onclick={handleDeleteConfirm}
					disabled={isDeletingTag}
				>
					{#if isDeletingTag}
						<span class="loading loading-spinner"></span>
					{/if}
					Confirm Delete
				</button>
				<button class="btn" type="button" onclick={handleDeleteCancel} disabled={isDeletingTag}>
					Cancel
				</button>
			</div>
		</div>
	</dialog>
{:else}
	<!-- Loading state -->
	<div class="flex justify-center items-center p-8">
		<span class="loading loading-spinner loading-lg"></span>
	</div>
{/if}

<svelte:window
	ondrag={(e) => {
		const el = document.elementFromPoint(e.clientX, e.clientY);

		// Check if dragging over a tag details element
		let node: HTMLElement | null | undefined = el?.closest('details');
		if (node && [...node.classList].includes('dragover')) return;

		if (node) {
			currentlyDragedOver?.classList.remove('dragover');
			currentlyDragedOver = node;
			currentlyDragedOver.classList.add('dragover');
			return;
		}

		// Check if dragging over root drop area
		const rootArea = el?.closest('.border-t.border-base-300');
		if (rootArea && rootArea.classList.contains('dragover')) return;

		currentlyDragedOver?.classList.remove('dragover');
	}}
	ondragend={() => {
		document.querySelector('.dragover')?.classList.remove('dragover');
	}}
	ondragover={(e) => {
		e.preventDefault();
		if (!e.dataTransfer) {
			return;
		}

		// Only accept tag drops at root level (check both dataTransfer and fallback)
		if (!e.dataTransfer.types.includes('application/x-tag-id') && !dragState.getTagId()) {
			e.dataTransfer.dropEffect = 'none';
			return;
		}

		e.dataTransfer.dropEffect = 'move';
	}}
	ondragleave={() => {
		// Drag leave handler
	}}
	ondrop={async (e) => {
		e.preventDefault();

		if (!e.dataTransfer) {
			return;
		}

		// Only handle tag drops (check both dataTransfer and fallback state)
		if (!e.dataTransfer.types.includes('application/x-tag-id') && !dragState.getTagId()) {
			return;
		}

		// Try dataTransfer first (desktop)
		let tagId = e.dataTransfer.getData('application/x-tag-id');

		// Fallback to global state if dataTransfer is empty (mobile)
		if (!tagId) {
			tagId = dragState.getTagId() as string;
		}

		if (!tagId) {
			return;
		}

		try {
			await updateTagParent(tagId, null);
		} catch (error) {
			console.error('Failed to move tag to root:', error);
		} finally {
			// Clear drag state after drop
			dragState.clear();
		}
	}}
/>
