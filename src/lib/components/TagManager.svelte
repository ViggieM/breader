<script lang="ts">
	// ABOUTME: Tag editor component for managing tags with inline editing and deletion
	// ABOUTME: Displays hierarchical tag tree with drag handles, edit functionality, and delete buttons

	import { SvelteMap } from 'svelte/reactivity';
	import { Tag, type TagData } from '$lib/types';
	import { db } from '$lib/db';
	import Dexie from 'dexie';
	import { readable } from 'svelte/store';
	import { bookmarksData } from '$lib/stores/search.svelte';
	import TagManagerTag from '$lib/components/TagManagerTag.svelte';

	const { liveQuery } = Dexie;

	interface RenderNode {
		tag: Tag;
		level: number;
		children: RenderNode[];
		bookmarksCount: number; // number of bookmarks with this tag
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
					children: buildTree(id, level + 1),
					bookmarksCount: tagCounts.get(id) || 0
				};
			});
		};
		return buildTree(null);
	});
</script>

<div class="w-full">
	{#if tags.length === 0}
		<p class="text-gray-500 text-sm">No tags yet. Create your first tag when adding a bookmark.</p>
	{:else}
		<div class="border border-base-300 rounded-lg">
			<ul class="menu menu-xs w-full p-0">
				{#each renderTree as node (node.tag.id)}
					<TagManagerTag {node}></TagManagerTag>
				{/each}
			</ul>
		</div>
	{/if}
</div>
