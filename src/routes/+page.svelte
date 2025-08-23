<script lang="ts">
	import { derived } from 'svelte/store';
	import { replaceState } from '$app/navigation';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import UrlList from '$lib/components/UrlList.svelte';
	import { engine, filters } from '$lib/stores/search.svelte';
	import { Bookmark } from '$lib/types';

	let results = derived([engine, filters], ([$engine, $filters]) => {
		if (!$engine) return [];
		let results = $engine.search($filters.query.trim());

		if ($filters.isReviewed) {
			results = results.filter((b) => !b.isReviewed);
		}
		if ($filters.isStarred) {
			results = results.filter((b) => b.isStarred);
		}

		return results?.map((b) => new Bookmark(b));
	});

	// Update URL when query changes (for bookmarking/sharing)
	function updateURL() {
		const url = new URL(window.location.href);
		if (!$filters.query.trim()) {
			url.searchParams.delete('q');
		} else {
			url.searchParams.set('q', $filters.query);
		}
		replaceState(url, {});
	}
</script>

<main>
	<section>
		<label for="search-input" class="sr-only">Search for content</label>
		<input
			id="search-input"
			type="search"
			bind:value={$filters.query}
			oninput={updateURL}
			placeholder="Search..."
			class="input w-full"
		/>
		<div class="my-2">
			<SearchFilter></SearchFilter>
		</div>

		{#if $results}
			<UrlList items={$results}></UrlList>
		{:else}
			<p class="flex items-center justify-center gap-2">
				<span class="loading loading-spinner loading-lg"></span> Loading bookmarks...
			</p>
		{/if}
	</section>
</main>
