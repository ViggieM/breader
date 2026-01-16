<!-- ABOUTME: Component for managing notes associated with a specific bookmark -->
<!-- ABOUTME: Uses Dexie liveQuery and derived stores for reactive database access -->
<script lang="ts">
	import { tick, untrack } from 'svelte';
	import Note from '$lib/components/Note.svelte';
	import { createBookmarkNotesStore } from '$lib/stores/bookmarkNotes.svelte.js';
	import { createNote, updateNote, deleteNote as deleteNoteFromDb } from '$lib/db/notes';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

	// Types
	type BookmarkNotesProps = {
		bookmarkId: string;
	};

	// Props
	let { bookmarkId }: BookmarkNotesProps = $props();

	// Store initialization (intentional one-time capture for store creation)
	const notesStore = createBookmarkNotesStore(untrack(() => bookmarkId));
	let notes = $derived($notesStore);
	let sortedNotes = $derived([...notes].sort((a, b) => b.created.localeCompare(a.created)));

	// Track newly created notes for auto-opening and focusing
	let newlyCreatedNoteId = $state<string | null>(null);

	// Note management functions
	async function addNote() {
		try {
			const noteId = await createNote(bookmarkId, '');
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

<section class="mt-2">
	<div>
		<ul class="space-y-1">
			{#each sortedNotes as note (note.id)}
				<li><Note {note} onSave={saveNote} onDelete={deleteNote} /></li>
			{/each}
		</ul>
		<button onclick={addNote} class="btn btn-outline btn-sm mt-4" aria-label="Add note">
			<span class="icon-[ri--add-large-fill]"></span>
			Add note
		</button>
	</div>
</section>
