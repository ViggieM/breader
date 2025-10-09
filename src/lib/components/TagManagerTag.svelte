<script lang="ts">
	import TagManagerTag from '$lib/components/TagManagerTag.svelte';
	import { db } from '$lib/db';
	import { Tag } from '$lib/types';

	let { node } = $props();

	// todo: duplicated from TagManager
	interface RenderNode {
		tag: Tag;
		level: number;
		children: RenderNode[];
		bookmarksCount: number; // number of bookmarks with this tag
	}

	let tagName = $state(node.tag.name);
	let tagNameHasChanged = $derived(tagName !== node.tag.name);
	let tagNameCanBeSaved = $derived(tagNameHasChanged && tagName.trim());

	async function deleteTag(tagId: string) {
		const confirmed = confirm(
			'Are you sure you want to delete this tag? This action cannot be undone.'
		);
		if (confirmed) {
			try {
				await db.tags.delete(tagId);
			} catch (error) {
				console.error('Error deleting tag:', error);
			}
		}
	}

	function cancelEditing() {
		tagName = node.tag.name;
	}

	async function saveEdit() {
		if (tagNameCanBeSaved) {
			try {
				await db.tags.update(node.tag.id, { name: tagName });
			} catch (error) {
				console.error('Error updating tag:', error);
			}
		}
	}
</script>

{#snippet tagNode(node: RenderNode)}
	<div class="flex items-center gap-1 w-full flex-1">
		<span
			class="icon-[material-symbols--drag-indicator] text-gray-400 cursor-grab"
			title="Drag to reorder"
		></span>

		<span class="text-sm font-medium flex-1 min-w-0 truncate {node.level === 0 ? 'font-bold' : ''}">
			<span bind:innerText={tagName} contenteditable class="cursor-text"></span>
			<span class="opacity-60">({node.bookmarksCount})</span>
		</span>

		{#if tagNameCanBeSaved}
			<button
				class="btn btn-xs btn-success text-base-content/70 hover:text-primary"
				onclick={() => saveEdit()}
				title="Save changes"
				aria-label="Save changes for tag {node.tag.name}"
			>
				<span class="icon-[ri--check-fill]"></span>
			</button>
		{/if}
		{#if tagNameHasChanged}
			<button
				class="btn btn-error btn-xs text-base-content/70 hover:text-primary"
				onclick={() => cancelEditing()}
				title="Cancel editing"
				aria-label="Cancel editing {node.tag.name}"
			>
				<span class="icon-[ri--close-fill]"></span>
			</button>
		{:else}
			<button
				class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
				onclick={(e) => {
					e.stopPropagation();
					deleteTag(node.tag.id);
				}}
				title="Delete tag"
				aria-label="Delete tag {node.tag.name}"
			>
				<span class="icon-[material-symbols--delete-outline]"></span>
			</button>
		{/if}
	</div>
{/snippet}

{#if node.children.length > 0}
	<li>
		<details open>
			<summary class="px-2 after:hidden flex w-full">
				{@render tagNode(node)}
			</summary>
			<ul class="ml-4">
				{#each node.children as child (child.tag.id)}
					<TagManagerTag node={child}></TagManagerTag>
				{/each}
			</ul>
		</details>
	</li>
{:else}
	<li>
		{@render tagNode(node)}
	</li>
{/if}
