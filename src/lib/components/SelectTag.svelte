<script lang="ts">
	// ABOUTME: Parent tag selection component using hierarchical tree with radio buttons
	// ABOUTME: Allows selecting a parent tag from existing tags or choosing no parent

	import { SvelteMap } from 'svelte/reactivity';
	import { tagsData } from '$lib/stores/tags.svelte';
	import type { TagData } from '$lib/types';

	// Reactive render tree for template
	interface RenderNode {
		tag: TagData;
		level: number;
		children: RenderNode[];
	}

	// Props - bindable selected parent ID
	let { selectedParentId = $bindable() }: { selectedParentId: string | null } = $props();

	// Get tags from the store
	const tags = $derived($tagsData);

	// Reference to the details element for controlling open/close state
	let detailsElement = $state() as HTMLDetailsElement;

	// Reactive lookup maps using $derived.by for complex computations
	const tagMap = $derived.by(() => {
		const map = new SvelteMap<string, TagData>();
		tags.forEach((tag) => map.set(tag.id, tag));
		return map;
	});

	const childrenMap = $derived.by(() => {
		const map = new SvelteMap<string, string[]>();
		tags.forEach((tag) => {
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

	function selectParentTag(tagId: string | null) {
		selectedParentId = tagId;
		// Close the details dropdown after selection
		if (detailsElement) {
			detailsElement.open = false;
		}
	}
</script>

{#snippet tagNode(node: RenderNode)}
	{#if node.children.length > 0}
		<li>
			<details>
				<summary class={node.level === 0 ? 'font-medium' : 'text-sm'}>
					<span class="flex items-center gap-2">
						<label class="label cursor-pointer justify-start gap-2 p-0">
							<input
								type="radio"
								name="parent-tag-radio"
								class="radio radio-xs"
								checked={selectedParentId === node.tag.id}
								onchange={(e) => {
									e.stopPropagation();
									selectParentTag(node.tag.id);
								}}
								onclick={(e) => e.stopPropagation()}
							/>
							<span class="text-sm {node.level === 0 ? 'font-medium' : ''}">{node.tag.name}</span>
						</label>
					</span>
				</summary>
				<ul>
					{#each node.children as child (child.tag.id)}
						{@render tagNode(child)}
					{/each}
				</ul>
			</details>
		</li>
	{:else}
		<li>
			<label class="label cursor-pointer justify-start gap-2 p-2">
				<input
					type="radio"
					name="parent-tag-radio"
					class="radio radio-xs"
					checked={selectedParentId === node.tag.id}
					onchange={(e) => {
						e.stopPropagation();
						selectParentTag(node.tag.id);
					}}
					onclick={(e) => e.stopPropagation()}
				/>
				<span class="text-sm">{node.tag.name}</span>
			</label>
		</li>
	{/if}
{/snippet}

<div class="w-full mt-2">
	<details class="w-full" bind:this={detailsElement}>
		<summary class="no-marker btn-xs" class:btn={selectedParentId === null}>
			{#if selectedParentId === null}
				Select Parent Tag
			{:else}
				{@const selectedTag = tagMap.get(selectedParentId)}
				{#if selectedTag}
					<div class="flex flex-wrap gap-1 items-center">
						<div class="tag-badge">
							{selectedTag.name}
							<button
								onclick={(e) => {
									e.stopPropagation();
									selectParentTag(null);
								}}
							>
								×
							</button>
						</div>
						<button
							class="btn ml-2 btn-ghost btn-xs pt-0.5"
							onclick={(e) => {
								e.stopPropagation();
								selectParentTag(null);
							}}
						>
							Clear Selection
						</button>
					</div>
				{/if}
			{/if}
		</summary>

		<ul class="menu dropdown-content menu-xs w-full p-0 mt-1">
			{#each renderTree as node (node.tag.id)}
				{@render tagNode(node)}
			{/each}
		</ul>
	</details>
</div>
