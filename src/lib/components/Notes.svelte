<!-- ABOUTME: Component for managing bookmark notes with add, edit, delete functionality -->
<!-- ABOUTME: Uses bindable notes array to sync with parent component -->
<script lang="ts">
	import { formatDateAndTime } from '$lib';

	// Types
	type Note = { id: string; text: string; created: string };

	type NotesProps = {
		notes: Note[];
	};

	// Props
	let { notes = $bindable([]) }: NotesProps = $props();

	// Internal state
	let editingNotes = $state(new Map<string, string>()); // Map of noteId -> original text
	let sortedNotes = $derived([...notes].sort((a, b) => b.created.localeCompare(a.created)));

	// Note management functions
	function addNote() {
		const id = crypto.randomUUID();
		const newNote = { id, text: '', created: new Date().toISOString() };
		notes.push(newNote);
		editingNotes.set(id, '');
	}

	function saveNote(noteId: string, newText: string) {
		const note = notes.find((n) => n.id === noteId);
		if (note) {
			note.text = newText;
		}
		editingNotes.delete(noteId);
	}

	function cancelNote(noteId: string) {
		const originalText = editingNotes.get(noteId);
		if (originalText === '') {
			// New note, remove it
			notes = notes.filter((n) => n.id !== noteId);
		} else {
			// Revert to original text
			const note = notes.find((n) => n.id === noteId);
			if (note && originalText !== undefined) {
				note.text = originalText;
			}
		}
		editingNotes.delete(noteId);
	}

	function deleteNote(noteId: string) {
		notes = notes.filter((n) => n.id !== noteId);
		editingNotes.delete(noteId);
	}

	function startEditingNote(noteId: string, currentText: string) {
		if (!editingNotes.has(noteId)) {
			editingNotes.set(noteId, currentText);
		}
	}

	function isNoteEdited(noteId: string, currentText: string): boolean {
		const originalText = editingNotes.get(noteId);
		return originalText !== undefined && currentText !== originalText;
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
			<div class="card bg-base-200">
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

					{#if editingNotes.has(note.id) && isNoteEdited(note.id, note.text)}
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
