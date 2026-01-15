<script lang="ts">
	import { resolve } from '$app/paths';
	import { db } from '$lib/db';
	import TagForm from './TagForm.svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	let addNoteDialog = $state() as HTMLDialogElement;
	let addTagDialog = $state() as HTMLDialogElement;

	// Add Note functionality
	let addNoteForm = $state() as HTMLFormElement;
	let noteTitle = $state('');
	let noteText = $state('');

	async function handleAddNote(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		if (!noteText.trim()) {
			return;
		}

		try {
			await db.notes.add({
				title: noteTitle.trim() || null,
				text: noteText.trim(),
				bookmarks: [],
				created: new Date().toISOString(),
				modified: null
			});

			// Reset form and close dialog
			noteTitle = '';
			noteText = '';
			addNoteForm.reset();
			addNoteDialog.close();
		} catch (error) {
			console.error('Failed to create note:', error);
		}
	}
</script>

<div class="dropdown dropdown-top md:dropdown-bottom dropdown-end">
	<div tabindex="0" role="button" class={className}>
		<span class="icon-[ri--add-large-fill]"></span>
	</div>
	<ul
		tabindex="-1"
		class="dropdown-content menu bg-base-100 rounded-box z-1 w-42 p-2 shadow-sm my-1 mb-2"
	>
		<li>
			<a href={resolve('/add-bookmark')}>
				<span class="icon-[ri--bookmark-line]"></span>
				Add Bookmark
			</a>
		</li>
		<li>
			<button onclick={() => addNoteDialog.showModal()}>
				<span class="icon-[ri--sticky-note-line]"></span>
				Add Note
			</button>
		</li>
		<li>
			<button onclick={() => addTagDialog.showModal()}>
				<span class="icon-[ri--price-tag-3-line]"></span>
				Add Tag
			</button>
		</li>
	</ul>
</div>

<dialog bind:this={addNoteDialog} class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>

		<h3 class="text-lg font-bold">Add a new Note</h3>
		<form bind:this={addNoteForm} id="add-note-form" class="mt-4" onsubmit={handleAddNote}>
			<div class="form-group space-y-4">
				<label class="input input-bordered flex items-center gap-2">
					<input
						bind:value={noteTitle}
						name="title"
						type="text"
						placeholder="Note title (optional)"
						class="grow"
					/>
				</label>
				<textarea
					bind:value={noteText}
					name="text"
					placeholder="Write your note here..."
					required
					class="textarea textarea-bordered w-full min-h-[150px]"
				></textarea>
			</div>
		</form>
		<div class="mt-4 text-right">
			<button class="btn btn-primary" type="submit" form="add-note-form" disabled={!noteText.trim()}
				>Save</button
			>
			<button
				class="btn btn-error"
				onclick={() => {
					addNoteDialog.close();
					noteTitle = '';
					noteText = '';
					addNoteForm.reset();
				}}>Cancel</button
			>
		</div>
	</div>
</dialog>

<dialog bind:this={addTagDialog} class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>

		<h3 class="text-lg font-bold mb-4">Add a new tag</h3>

		<TagForm onSuccess={() => addTagDialog.close()} />
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
