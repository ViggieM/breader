<!-- ABOUTME: Component for managing notes associated with a specific bookmark -->
<!-- ABOUTME: Uses Dexie liveQuery and derived stores for reactive database access -->
<script lang="ts">
	import Note from '$lib/components/Note.svelte';
	import { createBookmarkNotesStore } from '$lib/stores/bookmarkNotes.svelte.js';
	import { createNote, updateNote, deleteNote as deleteNoteFromDb } from '$lib/db/notes';

	// Types
	type BookmarkNotesProps = {
		bookmarkId: string;
	};

	// Props
	let { bookmarkId }: BookmarkNotesProps = $props();

	// Store initialization
	const notesStore = createBookmarkNotesStore(bookmarkId);
	let notes = $derived($notesStore);
	let sortedNotes = $derived([...notes].sort((a, b) => b.created.localeCompare(a.created)));

	// Note management functions
	async function addNote() {
		try {
			await createNote(bookmarkId, '');
		} catch (error) {
			console.error('Failed to create note:', error);
		}
	}

	async function saveNote(noteId: string, newText: string, newTitle: string | null) {
		try {
			await updateNote(noteId, newText, newTitle);
		} catch (error) {
			console.error('Failed to save note:', error);
			throw error; // Re-throw so Note component can handle it
		}
	}

	async function deleteNote(noteId: string) {
		try {
			await deleteNoteFromDb(noteId);
		} catch (error) {
			console.error('Failed to delete note:', error);
			throw error; // Re-throw so Note component can handle it
		}
	}
</script>

<section class="mt-8">
	<div>
		<h2>Notes</h2>

		<ul class="mt-4 space-y-1">
			{#each sortedNotes as note (note.id)}
				<li><Note {note} onSave={saveNote} onDelete={deleteNote} /></li>
			{/each}
		</ul>
		<footer class="mt-4">
			<button class="btn btn-sm btn-outline" onclick={addNote}>
				<span class="icon-[ri--add-large-fill]"></span> Add a note
			</button>
		</footer>
	</div>
</section>
