<!-- ABOUTME: Individual note component with local reactive state for editing -->
<!-- ABOUTME: Handles save/cancel/delete operations with proper reactivity tracking -->
<script lang="ts">
	import { formatDateAndTime } from '$lib';
	import type { Note } from '$lib/types';

	type NoteProps = {
		note: Note;
		onSave: (noteId: string, text: string) => Promise<void>;
		onDelete: (noteId: string) => Promise<void>;
	};

	let { note, onSave, onDelete }: NoteProps = $props();

	// Local reactive state for editing - this makes text changes reactive!
	let text = $state(note.text);
	let originalText = $state(note.text);

	// Derived: has the note been edited?
	let hasChanges = $derived(text !== originalText);

	// Sync with database when note prop changes (but only if no local edits)
	$effect(() => {
		if (text === originalText) {
			text = note.text;
			originalText = note.text;
		}
	});

	async function save() {
		try {
			await onSave(note.id, text);
			// Update original only after successful save
			originalText = text;
		} catch (error) {
			console.error('Failed to save note:', error);
		}
	}

	async function cancel() {
		if (originalText === '') {
			// New note that was never saved, delete it
			await onDelete(note.id);
		} else {
			// Revert to original
			text = originalText;
		}
	}

	async function deleteNote() {
		await onDelete(note.id);
	}

	// Autogrow textarea action
	function autogrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}

		resize();
		node.addEventListener('input', resize);

		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	}
</script>

<div class="card bg-base-200" id={`note-${note.id}`}>
	<div class="card-body p-4 space-y-2">
		<div class="text-xs opacity-60 mb-2">
			{formatDateAndTime(note.created)}
		</div>
		<textarea
			bind:value={text}
			use:autogrow
			class="textarea textarea-ghost textarea-bordered w-full min-h-[100px] resize-none overflow-hidden"
			placeholder="Write your note here..."
		></textarea>

		{#if hasChanges}
			<div class="flex gap-2">
				<button class="btn btn-xs btn-success" onclick={save}> Save </button>
				<button class="btn btn-xs btn-error" onclick={cancel}> Cancel </button>
				<button class="btn btn-xs btn-ghost ml-auto" onclick={deleteNote}>
					<span class="icon-[ri--delete-bin-line]"></span>
					Delete
				</button>
			</div>
		{:else}
			<div class="flex justify-end">
				<button class="btn btn-xs btn-ghost" onclick={deleteNote}>
					<span class="icon-[ri--delete-bin-line]"></span>
					Delete
				</button>
			</div>
		{/if}
	</div>
</div>
