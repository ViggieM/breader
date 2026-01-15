<!-- ABOUTME: Individual note component with local reactive state for editing -->
<!-- ABOUTME: Handles save/cancel/delete operations with proper reactivity tracking -->
<script lang="ts">
	import { formatDateAndTime } from '$lib';
	import type { Note } from '$lib/types';
	import OvertypeEditor from './OvertypeEditor.svelte';

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

	function handleKeydown(event: KeyboardEvent) {
		// Check for Ctrl+Enter or Cmd+Enter (Mac)
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			// Only save if there are unsaved changes
			if (hasChanges) {
				event.preventDefault();
				save();
			}
		}
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
		<span class="icon-[ri--sticky-note-fill] text-base-content/50"></span>
		<span class="group-not-open:truncate">
			<form onsubmit={save}>
				<input
					bind:value={title}
					type="text"
					class="text-sm w-full"
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
		<span class="note-created-date text-xs text-base-content/60 whitespace-nowrap">
			{formatDateAndTime(note.modified || note.created)}
		</span>
	</summary>
	<article class="group-open:shadow space-y-4 mt-2">
		<OvertypeEditor
			bind:content={text}
			class="border-b border-base-300 mb-1"
			onkeydown={handleKeydown}
		/>
		<p class="text-xs text-base-content/60 mb-2">
			You can use <a href="https://www.markdownguide.org/getting-started/" class="link">Markdown</a>
			for editing notes
		</p>
		{#if hasChanges}
			<div class="flex gap-2 justify-end">
				<button class="btn btn-sm btn-success grow" onclick={save}> Save </button>
				<button class="btn btn-sm btn-error grow" onclick={cancel}> Cancel </button>
			</div>
		{:else}
			<div class="flex justify-end">
				<button class="btn btn-sm btn-ghost" onclick={deleteNote}>
					<span class="icon-[ri--delete-bin-line]"></span>
					Delete
				</button>
			</div>
		{/if}
	</article>
</details>

<style>
	details[open] {
		margin-bottom: 2rem;
		.note-created-date {
			display: none;
		}
	}
</style>
