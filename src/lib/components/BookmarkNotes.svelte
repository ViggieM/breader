<!-- ABOUTME: Component for managing notes associated with a specific bookmark -->
<!-- ABOUTME: Uses Dexie liveQuery and derived stores for reactive database access -->
<script lang="ts">
	import { formatDateAndTime } from '$lib';
	import { createBookmarkNotesStore } from '$lib/stores/bookmarkNotes.svelte.js';
	import { createNote, updateNote, deleteNote as deleteNoteFromDb } from '$lib/db/notes';
	import { SvelteMap } from 'svelte/reactivity';

	// Types
	type BookmarkNotesProps = {
		bookmarkId: string;
	};

	// Props
	let { bookmarkId }: BookmarkNotesProps = $props();

	// Store initialization
	const notesStore = createBookmarkNotesStore(bookmarkId);
	let notes = $derived($notesStore);

	// Internal state
	let editingNotes = new SvelteMap<string, string>(); // Map of noteId -> original text
	let sortedNotes = $derived([...notes].sort((a, b) => b.created.localeCompare(a.created)));

	// Note management functions
	async function addNote() {
		try {
			// Create in database with empty text
			const id = await createNote(bookmarkId, '');
			// Enter edit mode for the new note
			editingNotes.set(id, '');
		} catch (error) {
			console.error('Failed to create note:', error);
		}
	}

	async function saveNote(noteId: string, newText: string) {
		try {
			await updateNote(noteId, newText);
			editingNotes.delete(noteId);
		} catch (error) {
			console.error('Failed to save note:', error);
			// Keep edit mode active so user doesn't lose their work
		}
	}

	async function cancelNote(noteId: string) {
		try {
			const originalText = editingNotes.get(noteId);
			if (originalText === '') {
				// New note that was never saved, delete it
				await deleteNoteFromDb(noteId);
			}
			// For existing notes, just exit edit mode
			// The textarea is bound to note.text, so it will revert to DB value automatically when we exit edit mode
			editingNotes.delete(noteId);
		} catch (error) {
			console.error('Failed to cancel note:', error);
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await deleteNoteFromDb(noteId);
			editingNotes.delete(noteId);
		} catch (error) {
			console.error('Failed to delete note:', error);
		}
	}

	function startEditingNote(noteId: string, currentText: string) {
		if (!editingNotes.has(noteId)) {
			editingNotes.set(noteId, currentText);
		}
	}

	// Autogrow textarea action
	function autogrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}

		// Initial resize
		resize();

		// Resize on input
		node.addEventListener('input', resize);

		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}
</script>

<section class="mt-8">
	<div class="space-y-4">
		<button class="btn btn-sm btn-secondary" onclick={addNote}>
			<span class="icon-[ri--add-large-fill]"></span> Add a note
		</button>

		{#each sortedNotes as note (note.id)}
			<div class="card bg-base-200" id={`note-${note.id}`}>
				<div class="card-body p-4 space-y-2">
					<div class="text-xs opacity-60 mb-2">
						{formatDateAndTime(note.created)}
					</div>
					<textarea
						bind:value={note.text}
						use:autogrow
						oninput={() => startEditingNote(note.id, note.text)}
						class="textarea textarea-ghost textarea-bordered w-full min-h-[100px] resize-none overflow-hidden"
						placeholder="Write your note here..."
					></textarea>

					{#if editingNotes.has(note.id)}
						<div class="flex gap-2">
							<button class="btn btn-xs btn-success" onclick={() => saveNote(note.id, note.text)}>
								Save
							</button>
							<button class="btn btn-xs btn-error" onclick={() => cancelNote(note.id)}>
								Cancel
							</button>
							<button class="btn btn-xs btn-ghost ml-auto" onclick={() => deleteNote(note.id)}>
								<span class="icon-[ri--delete-bin-line]"></span>
								Delete
							</button>
						</div>
					{:else}
						<div class="flex justify-end">
							<button class="btn btn-xs btn-ghost" onclick={() => deleteNote(note.id)}>
								<span class="icon-[ri--delete-bin-line]"></span>
								Delete
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>
