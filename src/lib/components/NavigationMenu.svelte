<!-- ABOUTME: Main navigation menu component that displays favorites, archive, notes, untagged bookmarks, -->
<!-- ABOUTME: and hierarchical tag structure with collapsible sections and nested bookmarks -->

<script lang="ts">
	import { navigationData } from '$lib/stores/navigation.svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';
	import { updateTagParent, updateTagName, deleteTag } from '$lib/db/tags';
	import TagForm from './TagForm.svelte';
	import { tick } from 'svelte';
	import NavigationMenuBookmark from './NavigationMenuBookmark.svelte';
	import { dragState } from '$lib/stores/dragState.svelte';

	const dragHelpId = 'bookmark-drag-help';
	let currentlyDragedOver = $state<HTMLElement>();
	let isRootDropTarget = $state(false);
	let addTagDialogRef = $state() as HTMLDialogElement;

	// Edit tag dialog state
	let editDialog = $state<HTMLDialogElement>();
	let editForm = $state<HTMLFormElement>();
	let editTagName = $state('');
	let isEditing = $state(false);
	let editError = $state<string | null>(null);

	// Delete tag dialog state
	let deleteDialog = $state<HTMLDialogElement>();
	let isDeleting = $state(false);
	let deleteError = $state<string | null>(null);

	// Current tag being edited/deleted
	let currentTag = $state<{
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	} | null>(null);

	async function handleEditTag(tag: {
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	}) {
		currentTag = tag;
		editTagName = tag.name;
		editError = null;
		editDialog?.showModal();
		await tick();
		editDialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
	}

	async function handleEditSubmit(e: Event) {
		e.preventDefault();
		editError = null;

		if (!currentTag) return;

		const trimmedName = editTagName.trim();

		// Validate: name should not be empty and should be different
		if (!trimmedName || trimmedName === currentTag.name) {
			editDialog?.close();
			return;
		}

		// Additional validation
		if (trimmedName.length > 100) {
			editError = 'Tag name must be 100 characters or less';
			return;
		}

		isEditing = true;
		try {
			await updateTagName(currentTag.id, trimmedName);
			editDialog?.close();
			editForm?.reset();
			editTagName = '';
			currentTag = null;
		} catch (error) {
			console.error('Failed to rename tag:', error);
			editError = 'Failed to rename tag. Please try again.';
		} finally {
			isEditing = false;
		}
	}

	function handleDeleteClick(tag: {
		id: string;
		name: string;
		parentId: string | null;
		childrenCount: number;
	}) {
		currentTag = tag;
		deleteError = null;
		deleteDialog?.showModal();
	}

	function handleDeleteCancel() {
		deleteError = null;
		deleteDialog?.close();
		currentTag = null;
	}

	async function handleDeleteConfirm() {
		deleteError = null;

		if (!currentTag) return;

		isDeleting = true;
		try {
			await deleteTag(currentTag.id);
			deleteDialog?.close();
			currentTag = null;
		} catch (error) {
			console.error('Failed to delete tag:', error);
			deleteError = 'Failed to delete tag. Please try again.';
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if $navigationData}
	<span id={dragHelpId} class="sr-only">Drag bookmarks to tags to add that tag</span>
	<span id="tag-drag-help" class="sr-only">
		Drag tags to reorganize the hierarchy. Drop on another tag to make it a child, or drop in the
		space above the tags to make it a root-level tag.
	</span>
	<span id="bookmark-actions-help" class="sr-only">
		Expand bookmark to access notes, edit, share, and open actions
	</span>
	<ul class="menu rounded-box w-full p-0 mt-4">
		<!-- Static top-level links -->
		<li>
			<a href="/list/favorites" aria-label="View favorite bookmarks">
				<span class="icon-[ri--star-line] shrink-0" aria-hidden="true"></span>
				Favorites
			</a>
		</li>
		<li>
			<a href="/list/archived" aria-label="View archived bookmarks">
				<span class="icon-[ri--archive-2-line] shrink-0" aria-hidden="true"></span>
				Archive
			</a>
		</li>
		<li>
			<a href="/list/notes" aria-label="View notes">
				<span class="icon-[ri--sticky-note-line] shrink-0" aria-hidden="true"></span>
				Notes
			</a>
		</li>

		<div
			role="region"
			aria-label="Tag organization area"
			class="border-t border-base-300 py-4 mt-4"
			class:bg-base-200={isRootDropTarget}
		>
			<!-- Untagged bookmarks section -->
			{#each $navigationData.untagged as bookmark (bookmark.id)}
				<NavigationMenuBookmark {bookmark} />
			{/each}

			<!-- Tag tree with nested tags and bookmarks -->
			{#each $navigationData.tagTree as tagNode (tagNode.tag.id)}
				<NavigationMenuItem
					node={tagNode}
					onEditTag={handleEditTag}
					onDeleteTag={handleDeleteClick}
				/>
			{/each}
		</div>

		<!-- Empty state -->
		{#if $navigationData.tagTree.length === 0 && $navigationData.untagged.length === 0}
			<li class="text-center py-4 text-base-content/60">
				<p>No bookmarks yet</p>
			</li>
		{/if}
	</ul>
	<div class="px-3">
		<button class="btn btn-sm btn-outline" onclick={() => addTagDialogRef.showModal()}>
			<span class="icon-[ri--add-large-fill]"></span> Add a new tag
		</button>
	</div>

	<dialog bind:this={addTagDialogRef} class="modal">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
			</form>

			<h3 class="text-lg font-bold mb-4">Add a new tag</h3>

			<TagForm onSuccess={() => addTagDialogRef.close()} />
		</div>
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	</dialog>

	<!-- Edit Tag Dialog -->
	<dialog bind:this={editDialog} class="modal" aria-labelledby="edit-tag-title">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
					>✕</button
				>
			</form>

			<h3 id="edit-tag-title" class="text-lg font-bold">Edit Tag</h3>
			<form bind:this={editForm} class="mt-4" onsubmit={handleEditSubmit}>
				{#if editError}
					<div class="alert alert-error mb-4">
						<span class="icon-[ri--error-warning-fill]"></span>
						<span>{editError}</span>
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
							autofocus
							maxlength="100"
							class="grow"
							disabled={isEditing}
						/>
					</label>
				</div>
				<div class="mt-4 text-right">
					<button
						class="btn btn-primary"
						type="submit"
						disabled={!editTagName.trim() ||
							(currentTag && editTagName.trim() === currentTag.name) ||
							isEditing}
					>
						{#if isEditing}
							<span class="loading loading-spinner"></span>
						{/if}
						Save
					</button>
					<button
						class="btn"
						type="button"
						disabled={isEditing}
						onclick={() => {
							editDialog?.close();
							editForm?.reset();
							editError = null;
							currentTag = null;
						}}
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</dialog>

	<!-- Delete Tag Confirmation Dialog -->
	<dialog bind:this={deleteDialog} class="modal" aria-labelledby="delete-tag-title">
		<div class="modal-box">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
					>✕</button
				>
			</form>

			<h3 id="delete-tag-title" class="text-lg font-bold">Delete Tag</h3>
			{#if currentTag}
				<div class="mt-4">
					{#if deleteError}
						<div class="alert alert-error mb-4">
							<span class="icon-[ri--error-warning-fill]"></span>
							<span>{deleteError}</span>
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
					disabled={isDeleting}
				>
					{#if isDeleting}
						<span class="loading loading-spinner"></span>
					{/if}
					Confirm Delete
				</button>
				<button class="btn" type="button" onclick={handleDeleteCancel} disabled={isDeleting}>
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
		console.log('🔴 [WINDOW] dragend - cleaning up dragover classes');
		document.querySelector('.dragover')?.classList.remove('dragover');
		isRootDropTarget = false;
	}}
	ondragover={(e) => {
		e.preventDefault();
		if (!e.dataTransfer) {
			console.warn('⚠️ [WINDOW ROOT] dragover - No dataTransfer');
			return;
		}

		// Only accept tag drops at root level (check both dataTransfer and fallback)
		if (!e.dataTransfer.types.includes('application/x-tag-id') && !dragState.getTagId()) {
			e.dataTransfer.dropEffect = 'none';
			return;
		}

		console.log('🟡 [WINDOW ROOT] dragover - tag over root area', {
			dataTransferTypes: Array.from(e.dataTransfer.types),
			hasFallbackTag: Boolean(dragState.getTagId()),
			timestamp: new Date().toISOString()
		});

		e.dataTransfer.dropEffect = 'move';
		isRootDropTarget = true;
	}}
	ondragleave={() => {
		console.log('🔴 [WINDOW ROOT] dragleave');
		isRootDropTarget = false;
	}}
	ondrop={async (e) => {
		e.preventDefault();
		isRootDropTarget = false;

		console.log('🟣 [WINDOW ROOT] drop event triggered', {
			timestamp: new Date().toISOString()
		});

		if (!e.dataTransfer) {
			console.error('❌ [WINDOW ROOT] drop - No dataTransfer');
			return;
		}

		console.log('🟣 [WINDOW ROOT] dataTransfer types:', Array.from(e.dataTransfer.types));

		// Only handle tag drops (check both dataTransfer and fallback state)
		if (!e.dataTransfer.types.includes('application/x-tag-id') && !dragState.getTagId()) {
			console.log('ℹ️ [WINDOW ROOT] drop - not a tag drop, ignoring');
			return;
		}

		// Try dataTransfer first (desktop)
		let tagId = e.dataTransfer.getData('application/x-tag-id');

		// Fallback to global state if dataTransfer is empty (mobile)
		if (!tagId) {
			tagId = dragState.getTagId();
			if (tagId) {
				console.log('📱 [MOBILE FALLBACK] Using stored tag ID:', tagId);
			}
		}

		console.log('🟣 [WINDOW ROOT] Tag drop to root detected', { tagId });

		if (!tagId) {
			console.error('❌ [WINDOW ROOT] No tag ID found in drag data');
			return;
		}

		try {
			console.log('✅ [WINDOW ROOT] Moving tag to root level', { tagId });
			await updateTagParent(tagId, null);
			console.log('✅ [WINDOW ROOT] Tag moved to root successfully');
		} catch (error) {
			console.error('❌ [WINDOW ROOT] Failed to move tag to root:', error);
		} finally {
			// Clear drag state after drop
			dragState.clear();
		}
	}}
/>
