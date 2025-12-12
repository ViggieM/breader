// ABOUTME: Reactive Svelte store for accessing notes associated with a specific bookmark
// ABOUTME: Wraps Dexie liveQuery in a readable store following the pattern from search.svelte.ts

import { readable } from 'svelte/store';
import { getBookmarkNotes } from '$lib/db/notes';
import type { NoteData } from '$lib/types';

/**
 * Create a reactive store that provides access to all notes for a specific bookmark.
 * The store automatically updates when notes are added, modified, or deleted in the database.
 *
 * @param bookmarkId - The ID of the bookmark to get notes for
 * @returns A readable store that emits NoteData[] whenever the notes change
 */
export function createBookmarkNotesStore(bookmarkId: string) {
	return readable<NoteData[]>([], (set) => {
		const observable = getBookmarkNotes(bookmarkId);
		const subscription = observable.subscribe((notes: NoteData[] | undefined) => {
			if (notes) set(notes);
		});

		return () => subscription.unsubscribe();
	});
}
