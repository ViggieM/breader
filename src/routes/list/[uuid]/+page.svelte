<script lang="ts">
	import { Tag } from '$lib/types';
	import UrlList from '$lib/components/UrlList.svelte';
	import { results } from '$lib/components/SearchBar.svelte';
	import { derived } from 'svelte/store';
	import { descendantMap } from '$lib/stores/tags.svelte.js';

	const { data } = $props();
	let tag: Tag = $state(data.tag);

	const bookmarks = derived([results, descendantMap], ([results, descendantMap]) => {
		const decendants = descendantMap.get(tag.id) || [];
		const tags = [tag.id, ...decendants];
		return results.filter(
			(b) => b.tags && b.tags.some((bookmarkTag) => tags.includes(bookmarkTag))
		);
	});
</script>

<section class="mt-4">
	{#if $bookmarks.length > 0}
		<h2 class="mt-8 mb-2">{tag.name}</h2>
		<UrlList items={$bookmarks} />
	{:else if $bookmarks}
		<p class="flex items-center justify-center gap-2 text-base-content/60">
			No bookmarks found matching your search criteria.
		</p>
	{:else}
		<p class="flex items-center justify-center gap-2">
			<span class="loading loading-spinner loading-lg"></span> Loading bookmarks...
		</p>
	{/if}
</section>
