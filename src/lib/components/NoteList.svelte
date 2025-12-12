<!-- ABOUTME: Component for displaying notes in an expandable list view -->
<!-- ABOUTME: Uses details/summary pattern for collapsible notes with inline editing -->
<script lang="ts">
	import Note from '$lib/components/Note.svelte';
	import type { NoteData } from '$lib/types/note';

	type NoteListProps = {
		notes: NoteData[];
		onSave: (noteId: string, text: string, title: string | null) => Promise<void>;
		onDelete: (noteId: string) => Promise<void>;
	};

	let { notes, onSave, onDelete }: NoteListProps = $props();
</script>

{#if notes.length === 0}
	<div class="text-center text-base-content/60 py-8">
		<p>No notes yet. Create your first note!</p>
	</div>
{:else}
	<ul class="space-y-1">
		{#each notes as note (note.id)}
			<li>
				<Note {note} {onSave} {onDelete} />
			</li>
		{/each}
	</ul>
{/if}
