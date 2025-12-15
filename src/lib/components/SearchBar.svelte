<script module lang="ts">
	import { derived } from 'svelte/store';
	import { engine, filters } from '$lib/stores/search.svelte';
	import { Bookmark, BookmarkStatus } from '$lib/types';

	export const results = derived([engine, filters], ([$engine, $filters]) => {
		if (!$engine) return [];
		let results = $engine.search($filters.query.trim());

		if ($filters.showUnread) {
			results = results.filter(
				(b) => b.status === BookmarkStatus.WANT_TO_READ || b.status === BookmarkStatus.READING
			);
		}
		if ($filters.isStarred) {
			results = results.filter((b) => b.isStarred);
		}

		return results?.map((b) => new Bookmark(b));
	});
</script>

<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { db } from '$lib/db';

	// Update URL when query changes (for bookmarking/sharing)
	function updateURL() {
		const url = new URL(window.location.href);
		if (!$filters.query.trim()) {
			url.searchParams.delete('q');
		} else {
			url.searchParams.set('q', $filters.query);
		}
		replaceState(url, {});
	}

	// Add Note functionality
	let addNoteDialog = $state() as HTMLDialogElement;
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

<div class="flex gap-2">
	<label for="search-input" class="sr-only">Search for content</label>
	<input
		id="search-input"
		type="search"
		bind:value={$filters.query}
		oninput={updateURL}
		placeholder="Search..."
		class="input w-full"
	/>
	<div class="dropdown dropdown-bottom dropdown-end">
		<div tabindex="0" role="button" class="btn">
			<span class="icon-[ri--add-large-fill]"></span>
		</div>
		<ul
			tabindex="-1"
			class="dropdown-content menu bg-base-100 rounded-box z-1 w-42 p-2 shadow-sm mt-1"
		>
			<li>
				<a href="/add-bookmark">
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
		</ul>
	</div>
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
