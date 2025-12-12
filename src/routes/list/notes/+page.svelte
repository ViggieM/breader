<script lang="ts">
	import { db } from '$lib/db';
	import Dexie from 'dexie';
	import { readable } from 'svelte/store';
	import NoteList from '$lib/components/NoteList.svelte';
	import { updateNote, deleteNote as deleteNoteFromDb } from '$lib/db/notes';
	import type { NoteData } from '$lib/types/note';

	const { liveQuery } = Dexie;

	// Create reactive store for all notes
	const notesStore = readable<NoteData[]>([], (set) => {
		const subscription = liveQuery(async () => {
			const notes = await db.notes.orderBy('created').reverse().toArray();
			return notes;
		}).subscribe(set);

		return () => subscription.unsubscribe();
	});

	let notes = $derived($notesStore);

	// Save handler
	async function handleSave(noteId: string, text: string, title: string | null) {
		try {
			await updateNote(noteId, text, title);
		} catch (error) {
			console.error('Failed to save note:', error);
			throw error;
		}
	}

	// Delete handler
	async function handleDelete(noteId: string) {
		if (confirm('Are you sure you want to delete this note?')) {
			try {
				await deleteNoteFromDb(noteId);
			} catch (error) {
				console.error('Failed to delete note:', error);
				throw error;
			}
		}
	}
</script>

<h1 class="text-3xl font-bold">Notes</h1>

<section class="mt-4">
	<NoteList {notes} onSave={handleSave} onDelete={handleDelete} />
</section>
