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
	let isEditing = $state(false);
	let tagNode = $state() as HTMLElement;

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

	function startEditing(evt: MouseEvent) {
		evt.preventDefault();
		isEditing = true;
	}

	function cancelEditing() {
		tagName = node.tag.name;
		isEditing = false;
	}

	async function saveEdit() {
		if (tagNameCanBeSaved) {
			try {
				await db.tags.update(node.tag.id, { name: tagName });
			} catch (error) {
				console.error('Error updating tag:', error);
			} finally {
				isEditing = false;
			}
		}
	}

	// Stop editing when clicked outside without changes
	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!tagNameCanBeSaved && !tagNode.contains(event.target as Node)) {
				cancelEditing();
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

{#snippet tag(node: RenderNode)}
	<div bind:this={tagNode} class="flex items-center gap-1 w-full flex-1 min-h-6">
		<span
			class="icon-[material-symbols--drag-indicator] text-gray-400 cursor-grab"
			title="Drag to reorder"
		></span>

		<span
			class="text-base font-medium flex-1 min-w-0 truncate {node.level === 0 ? 'font-bold' : ''}"
		>
			<button
				bind:innerText={tagName}
				contenteditable
				class="cursor-text btn btn-ghost md:btn-sm text-base"
				onclick={startEditing}
				aria-label="Edit tag"
			></button>
			<span class="opacity-60">({node.bookmarksCount})</span>
		</span>

		{#if tagNameCanBeSaved}
			<button
				class="btn btn-sm btn-success text-base-content/70 hover:text-primary"
				onclick={() => saveEdit()}
				title="Save changes"
				aria-label="Save changes for tag {node.tag.name}"
			>
				<span class="icon-[ri--check-fill] size-4"></span>
			</button>
		{/if}
		{#if tagNameHasChanged}
			<button
				class="btn btn-error btn-sm text-base-content/70 hover:text-primary"
				onclick={() => cancelEditing()}
				title="Cancel editing"
				aria-label="Cancel editing {node.tag.name}"
			>
				<span class="icon-[ri--close-fill] size-4"></span>
			</button>
		{:else if isEditing}
			<button
				class="btn btn-sm btn-error"
				onclick={(e) => {
					e.stopPropagation();
					deleteTag(node.tag.id);
				}}
				title="Delete tag"
				aria-label="Delete tag {node.tag.name}"
			>
				<span class="icon-[ri--delete-bin-line] size-4"></span>
			</button>
		{/if}
	</div>
{/snippet}

{#if node.children.length > 0}
	<li>
		<details open>
			<summary class="px-2 flex w-full after:mr-3" class:after:hidden={isEditing}>
				{@render tag(node)}
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
		<div class="flex">
			{@render tag(node)}
		</div>
	</li>
{/if}
