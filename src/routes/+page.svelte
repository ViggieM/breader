<script lang="ts">
	import { derived } from 'svelte/store';
	import { replaceState } from '$app/navigation';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import SectionedUrlList from '$lib/components/SectionedUrlList.svelte';
	import { engine, filters, tagsData } from '$lib/stores/search.svelte';
	import { Bookmark } from '$lib/types';
	import { organizeBookmarksIntoSections } from '$lib/utils/sectionUtils';

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

	let sections = derived([results, tagsData], ([$results, $tagsData]) => {
		if (!$results || !$tagsData) return [];
		return organizeBookmarksIntoSections($results, $tagsData);
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

<main id="main-content">
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

		{#if $sections.length > 0}
			<SectionedUrlList sections={$sections}></SectionedUrlList>
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
