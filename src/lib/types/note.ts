// ABOUTME: Type definitions for Note entities
// ABOUTME: Includes NoteData for database persistence and Note class with computed properties

export type NoteData = Omit<Note, ''>;

export class Note {
	id: string;
	text: string;
	title: string | null;
	created: string;
	modified: string | null;
	bookmarks: string[]; // Array of bookmark IDs this note is related to

	constructor(data: NoteData) {
		this.id = data.id;
		this.text = data.text;
		this.title = data.title;
		this.created = data.created;
		this.modified = data.modified;
		this.bookmarks = data.bookmarks;
	}
}
