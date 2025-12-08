<script lang="ts">
	import UrlList from '$lib/components/UrlList.svelte';
	import { results } from '$lib/components/SearchBar.svelte';

	import { derived } from 'svelte/store';

	const favorites = derived(results, (results) => {
		return results.filter((b) => b.isStarred);
	});
</script>

<section class="mt-4">
	{#if $favorites.length > 0}
		<h2 class="mt-8 mb-2">Recently added</h2>
		<UrlList items={$favorites} />
	{:else if $favorites}
		<p class="flex items-center justify-center gap-2 text-base-content/60">
			No bookmarks found matching your search criteria.
		</p>
	{:else}
		<p class="flex items-center justify-center gap-2">
			<span class="loading loading-spinner loading-lg"></span> Loading bookmarks...
		</p>
	{/if}
</section>
