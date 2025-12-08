<script lang="ts">
	import { db } from '$lib/db';
	import UrlList from '$lib/components/UrlList.svelte';
	import { liveQuery } from 'dexie';
	import SearchBar, { results } from '$lib/components/SearchBar.svelte';

	const lists = liveQuery(() => db.lists.toArray());
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar />

	<section class="grid grid-cols-3 gap-2 mt-4">
		<a href="/list/favorites" class="list-card"
			><span class="icon-[ri--star-line]"></span>Favorites</a
		>
		<a href="/list/archived" class="list-card"
			><span class="icon-[ri--archive-2-line]"></span>Archive</a
		>
		<a href="/list/notes" class="list-card"
			><span class="icon-[ri--sticky-note-line]"></span>Notes</a
		>
		{#each $lists as list (list.id)}
			<a href={`/list/${list.id}`} class="list-card">{list.name}</a>
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
