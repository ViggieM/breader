<!-- ABOUTME: Individual note component with local reactive state for editing -->
<!-- ABOUTME: Handles save/cancel/delete operations with proper reactivity tracking -->
<script lang="ts">
	import { formatDateAndTime } from '$lib';
	import type { Note } from '$lib/types';

	type NoteProps = {
		note: Note;
		onSave: (noteId: string, text: string, title: string | null) => Promise<void>;
		onDelete: (noteId: string) => Promise<void>;
	};

	let { note, onSave, onDelete }: NoteProps = $props();

	// Local reactive state for editing - this makes text and title changes reactive!
	let text = $state(note.text);
	let originalText = $state(note.text);
	let title = $state(note.title || '');
	let originalTitle = $state(note.title || '');

	// Derived: has the note been edited?
	let hasChanges = $derived(text !== originalText || title !== originalTitle);

	// Sync with database when note prop changes (but only if no local edits)
	$effect(() => {
		if (text === originalText && title === originalTitle) {
			text = note.text;
			originalText = note.text;
			title = note.title || '';
			originalTitle = note.title || '';
		}
	});

	async function save() {
		try {
			await onSave(note.id, text, title || null);
			// Update original only after successful save
			originalText = text;
			originalTitle = title;
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
			title = originalTitle;
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

	function handleToggle(event: Event) {
		const currentDetails = event.target as HTMLDetailsElement;
		if (currentDetails.open) {
			// Close all other details elements
			const allDetails = document.querySelectorAll('.note-list-item details');
			allDetails.forEach((details) => {
				if (details !== currentDetails) {
					details.removeAttribute('open');
				}
			});

			// Scroll the opened details into view
			currentDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// Close details when clicking outside
	let detailsElement: HTMLDetailsElement;

	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (detailsElement && detailsElement.open && !detailsElement.contains(event.target as Node)) {
				detailsElement.open = false;
			}
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<details
	class="group note-list-item"
	ontoggle={handleToggle}
	id={`note-${note.id}`}
	bind:this={detailsElement}
>
	<summary>
		<span class="icon-[ri--sticky-note-line]"></span>
		<span class="group-not-open:truncate">
			<form onsubmit={save}>
				<input
					bind:value={title}
					type="text"
					class="text-base w-full"
					class:font-semibold={Boolean(title)}
					placeholder={`Untitled Note${note.text ? ': ' + note.text.substring(0, 20) : ''}${note.text.length > 20 ? '...' : ''}`}
					name="title"
					onclick={(e) => {
						const details = (e.target as HTMLElement).closest('details');
						if (details && !details.open) {
							details.open = true;
						}
					}}
				/>
			</form>
		</span>
		<span class="text-xs text-base-content/60 whitespace-nowrap">
			{formatDateAndTime(note.created)}
		</span>
	</summary>
	<article class="group-open:shadow space-y-4 mt-2">
		<textarea
			bind:value={text}
			use:autogrow
			class="textarea textarea-ghost textarea-bordered w-full min-h-[100px] resize-none overflow-hidden"
			placeholder="Write your note here..."
			name="text"
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
	</article>
</details>
