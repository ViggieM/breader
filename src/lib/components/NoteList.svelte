<!-- ABOUTME: Component for displaying notes in an expandable list view -->
<!-- ABOUTME: Uses details/summary pattern for collapsible notes with inline editing -->
<script lang="ts">
	import { formatDate } from '$lib';
	import Note from './Note.svelte';
	import type { NoteData } from '$lib/types/note';

	type NoteListProps = {
		notes: NoteData[];
		onSave: (noteId: string, text: string, title: string | null) => Promise<void>;
		onDelete: (noteId: string) => Promise<void>;
	};

	let { notes, onSave, onDelete }: NoteListProps = $props();

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
			currentDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}
</script>

{#if notes.length === 0}
	<div class="text-center text-base-content/60 py-8">
		<p>No notes yet. Create your first note!</p>
	</div>
{:else}
	<ul>
		{#each notes as note (note.id)}
			<li id={`note-${note.id}`} class="note-list-item">
				<details class="group" ontoggle={handleToggle}>
					<summary>
						<span class="icon-[ri--sticky-note-line]"></span>
						<span class="group-not-open:truncate">
							{#if note.title}
								<strong>{note.title}</strong>
							{:else}
								<span class="text-base-content/60"
									>Untitled Note: {note.text.substring(0, 50)}{note.text.length > 50
										? '...'
										: ''}</span
								>
							{/if}
						</span>
						<span class="text-xs text-base-content/60 whitespace-nowrap">
							{formatDate(note.created)}
						</span>
					</summary>
					<article class="group-open:shadow mt-2">
						<Note {note} {onSave} {onDelete} />
					</article>
				</details>
			</li>
		{/each}
	</ul>
{/if}
