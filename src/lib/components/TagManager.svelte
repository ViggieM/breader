<script lang="ts">
	// ABOUTME: Tag editor component for managing tags with inline editing and deletion
	// ABOUTME: Displays hierarchical tag tree with drag handles, edit functionality, and delete buttons

	import { SvelteMap } from 'svelte/reactivity';
	import { Tag, type TagData } from '$lib/types';
	import { db } from '$lib/db';
	import { liveQuery } from 'dexie';
	import { readable } from 'svelte/store';
	import { bookmarksData } from '$lib/stores/search.svelte';

	interface RenderNode {
		tag: Tag;
		level: number;
		children: RenderNode[];
	}

	// Create reactive store for tags data using Dexie liveQuery
	const tagsStore = readable<TagData[]>([], (set) => {
		const subscription = liveQuery(() => db.tags.orderBy('name').toArray()).subscribe(set);
		return () => subscription.unsubscribe();
	});

	const tags = $derived($tagsStore);
	const tagInstances = $derived(tags.map((data) => new Tag(data)));

	const tagCounts = $derived.by(() => {
		const counts = new Map<string, number>();
		$bookmarksData.forEach((bookmark) => {
			bookmark.tags.forEach((tagId) => {
				counts.set(tagId, (counts.get(tagId) || 0) + 1);
			});
		});
		return counts;
	});

	const tagMap = $derived.by(() => {
		const map = new SvelteMap<string, Tag>();
		tagInstances.forEach((tag) => map.set(tag.id, tag));
		return map;
	});

	const childrenMap = $derived.by(() => {
		const map = new SvelteMap<string, string[]>();
		tagInstances.forEach((tag) => {
			const parentId = tag.parentId || 'root';
			if (!map.has(parentId)) map.set(parentId, []);
			map.get(parentId)!.push(tag.id);
		});
		return map;
	});

	const renderTree = $derived.by(() => {
		const buildTree = (parentId: string | null, level = 0): RenderNode[] => {
			const childIds = childrenMap.get(parentId || 'root') || [];
			return childIds.map((id) => {
				const tag = tagMap.get(id)!;
				return {
					tag,
					level,
					children: buildTree(id, level + 1)
				};
			});
		};
		return buildTree(null);
	});

	// State for inline editing
	let editingTagId = $state<string | null>(null);
	let editingValue = $state('');

	function startEditing(tag: Tag) {
		editingTagId = tag.id;
		editingValue = tag.name;
	}

	function cancelEditing() {
		editingTagId = null;
		editingValue = '';
	}

	async function saveEdit(tagId: string) {
		if (editingValue.trim()) {
			try {
				await db.tags.update(tagId, { name: editingValue.trim() });
				editingTagId = null;
				editingValue = '';
			} catch (error) {
				console.error('Error updating tag:', error);
			}
		}
	}

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

	function handleKeydown(event: KeyboardEvent, tagId: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveEdit(tagId);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
	}

	// Focus directive for auto-focusing input when editing starts
	function focus(node: HTMLInputElement) {
		node.focus();
		node.select();
	}
</script>

{#snippet tagNode(node: RenderNode)}
	{#if node.children.length > 0}
		<li>
			<details open>
				<summary class="p-2 after:hidden flex w-full">
					<div class="flex items-center gap-2 w-full flex-1">
						<span
							class="icon-[material-symbols--drag-indicator] text-gray-400 cursor-grab"
							title="Drag to reorder"
						></span>

						{#if editingTagId === node.tag.id}
							<input
								type="text"
								bind:value={editingValue}
								class="input input-sm flex-1 min-w-0"
								onkeydown={(e) => handleKeydown(e, node.tag.id)}
								onblur={() => saveEdit(node.tag.id)}
								use:focus
							/>
						{:else}
							<span
								class="text-sm font-medium flex-1 min-w-0 truncate {node.level === 0
									? 'font-bold'
									: ''}"
							>
								{node.tag.name} <span class="opacity-60">({tagCounts.get(node.tag.id) || 0})</span>
							</span>
							<button
								class="btn btn-ghost btn-xs text-base-content/70 hover:text-primary"
								onclick={() => startEditing(node.tag)}
								title="Edit tag name"
								aria-label="Edit tag {node.tag.name}"
							>
								<span class="icon-[material-symbols--edit-outline]"></span>
							</button>
						{/if}

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
					</div>
				</summary>
				<ul class="ml-4">
					{#each node.children as child (child.tag.id)}
						{@render tagNode(child)}
					{/each}
				</ul>
			</details>
		</li>
	{:else}
		<li>
			<div class="flex items-center gap-2 p-2">
				<span
					class="icon-[material-symbols--drag-indicator] text-gray-400 cursor-grab"
					title="Drag to reorder"
				></span>

				{#if editingTagId === node.tag.id}
					<input
						type="text"
						bind:value={editingValue}
						class="input input-sm flex-1 min-w-0"
						onkeydown={(e) => handleKeydown(e, node.tag.id)}
						onblur={() => saveEdit(node.tag.id)}
						use:focus
					/>
				{:else}
					<span class="text-sm flex-1 min-w-0 truncate">
						{node.tag.name} <span class="opacity-60">({tagCounts.get(node.tag.id) || 0})</span>
					</span>
					<button
						class="btn btn-ghost btn-xs text-base-content/70 hover:text-primary"
						onclick={() => startEditing(node.tag)}
						title="Edit tag name"
						aria-label="Edit tag {node.tag.name}"
					>
						<span class="icon-[material-symbols--edit-outline]"></span>
					</button>
				{/if}

				<button
					class="btn btn-ghost btn-xs text-error hover:bg-error hover:text-error-content"
					onclick={() => deleteTag(node.tag.id)}
					title="Delete tag"
					aria-label="Delete tag {node.tag.name}"
				>
					<span class="icon-[material-symbols--delete-outline]"></span>
				</button>
			</div>
		</li>
	{/if}
{/snippet}

<div class="w-full">
	{#if tags.length === 0}
		<p class="text-gray-500 text-sm">No tags yet. Create your first tag when adding a bookmark.</p>
	{:else}
		<div class="border border-base-300 rounded-lg">
			<ul class="menu menu-xs w-full p-0">
				{#each renderTree as node (node.tag.id)}
					{@render tagNode(node)}
				{/each}
			</ul>
		</div>
	{/if}
</div>
