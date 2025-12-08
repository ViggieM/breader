<script lang="ts">
	import { descendantMap, ancestorMap, childrenMap, tagMap } from '$lib/stores/tags.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Tag } from '$lib/types';
	import TagForm from '$lib/components/TagForm.svelte';

	import { derived } from 'svelte/store';
	let addTagModal = $state() as HTMLDialogElement;

	interface RenderNode {
		tag: Tag;
		level: number;
		checkboxState: 'checked' | 'indeterminate' | 'unchecked';
		children: RenderNode[];
	}

	let {
		selectedTags,
		multiSelectDetails = $bindable()
	}: {
		selectedTags: SvelteSet<string>;
		multiSelectDetails?: HTMLDetailsElement;
	} = $props();

	function selectTag(tagId: string) {
		selectedTags.add(tagId);
		$descendantMap.get(tagId)?.forEach((id) => selectedTags.delete(id));
		$ancestorMap.get(tagId)?.forEach((id) => selectedTags.delete(id));
	}

	function toggleTag(tagId: string) {
		if (selectedTags.has(tagId)) {
			selectedTags.delete(tagId);
			$descendantMap.get(tagId)?.forEach((id) => selectedTags.delete(id));
		} else {
			selectTag(tagId);
		}
	}

	function getCheckboxState(tagId: string): 'checked' | 'indeterminate' | 'unchecked' {
		if (selectedTags.has(tagId)) return 'checked';

		const descendants = $descendantMap.get(tagId) || [];
		const hasSelectedDescendants = descendants.some((id) => selectedTags.has(id));

		return hasSelectedDescendants ? 'indeterminate' : 'unchecked';
	}

	const renderTree = derived([childrenMap, tagMap], ([$childrenMap, $tagMap]) => {
		const buildTree = (parentId: string | null, level = 0): RenderNode[] => {
			const childIds = $childrenMap.get(parentId || 'root') || [];
			return childIds.map((id) => {
				const tag = $tagMap.get(id)!;
				return {
					tag,
					level,
					checkboxState: getCheckboxState(id),
					children: buildTree(id, level + 1)
				};
			});
		};
		return buildTree(null);
	});

	export function getSelectedTagsDisplay(): Tag[] {
		return Array.from(selectedTags)
			.map((id) => $tagMap.get(id)!)
			.filter(Boolean);
	}
</script>

{#snippet tagNode(node: RenderNode)}
	{#if node.children.length > 0}
		<li>
			<details>
				<summary class="p-1">
					<span class="flex items-center gap-2">
						<label class="label cursor-pointer justify-start gap-2 p-0">
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={node.checkboxState === 'checked'}
								indeterminate={node.checkboxState === 'indeterminate'}
								onchange={(e) => {
									e.stopPropagation();
									toggleTag(node.tag.id);
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
			<label class="label cursor-pointer justify-start gap-2 p-1">
				<input
					type="checkbox"
					class="checkbox checkbox-xs"
					checked={selectedTags.has(node.tag.id)}
					onchange={(e) => {
						e.stopPropagation();
						toggleTag(node.tag.id);
					}}
					onclick={(e) => e.stopPropagation()}
				/>
				<span class="text-sm">{node.tag.name}</span>
			</label>
		</li>
	{/if}
{/snippet}

<div class="w-full mt-2">
	<details class="w-full" bind:this={multiSelectDetails}>
		<summary class="no-marker btn-xs" class:btn={selectedTags.size === 0}>
			{#if selectedTags.size === 0}
				Select Tags
			{:else}
				<div class="flex flex-wrap gap-1 items-center">
					{#each getSelectedTagsDisplay() as tag (tag.id)}
						<div class="tag-badge">
							{tag.name}
							<button
								onclick={(e) => {
									e.stopPropagation();
									toggleTag(tag.id);
								}}
							>
								×
							</button>
						</div>
					{/each}
					<button
						class="btn ml-2 btn-ghost btn-xs pt-0.5"
						onclick={(e) => {
							e.stopPropagation();
							selectedTags.clear();
						}}
					>
						Clear All
					</button>
				</div>
			{/if}
		</summary>

		<ul class="menu dropdown-content menu-xs w-full p-0 mt-1">
			{#each $renderTree as node (node.tag.id)}
				{@render tagNode(node)}
			{/each}
			<li class="mt-2">
				<button
					class="btn btn-sm w-32"
					onclick={(e) => {
						e.stopPropagation();
						addTagModal.showModal();
					}}>Add a Tag</button
				>
			</li>
		</ul>
	</details>
</div>

<dialog id="addTagModal" bind:this={addTagModal} class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Add a new Tag</h3>
		<div class="mt-2">
			<TagForm
				onSuccess={(newTagId) => {
					addTagModal.close();
					selectTag(newTagId);
				}}
			/>
		</div>
		<div class="modal-action">
			<form method="dialog">
				<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
			</form>
		</div>
	</div>
</dialog>
