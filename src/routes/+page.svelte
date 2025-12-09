<script lang="ts">
	import UrlList from '$lib/components/UrlList.svelte';
	import SearchBar, { results } from '$lib/components/SearchBar.svelte';
	import { childrenMap, tagMap } from '$lib/stores/tags.svelte';
	import { derived } from 'svelte/store';
	import { Tag } from '$lib/types';

	const tags = derived(childrenMap, (childrenMap) => {
		return childrenMap.get('root')?.map((tagId) => new Tag($tagMap.get(tagId)));
	});
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar />

	<section class="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 mt-4">
		<a href="/list/favorites" class="list-card"
			><span class="icon-[ri--star-line] shrink-0"></span><span class="truncate">Favorites</span></a
		>
		<a href="/list/archived" class="list-card"
			><span class="icon-[ri--archive-2-line] shrink-0"></span><span class="truncate">Archive</span
			></a
		>
		<a href="/list/notes" class="list-card"
			><span class="icon-[ri--sticky-note-line] shrink-0"></span><span class="truncate">Notes</span
			></a
		>
		{#each $tags as tag (tag.id)}
			<a href={`/list/${tag.id}`} class="list-card"><span class="truncate">{tag.name}</span></a>
		{/each}
	</section>

	<section class="mt-4">
		{#if $results.length > 0}
			<h2 class="mt-8 mb-2">Recently added</h2>
			<UrlList items={$results} />
		{:else if $results}
			<p class="flex items-center justify-center gap-2 text-base-content/60">
				No bookmarks found matching your search criteria.
			</p>
		{:else}
			<p class="flex items-center justify-center gap-2">
				<span class="loading loading-spinner loading-lg"></span> Loading bookmarks...
			</p>
		{/if}
	</section>
</main>
