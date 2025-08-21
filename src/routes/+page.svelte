<script lang="ts">
import { onMount } from 'svelte';
import SearchFilter from '$lib/components/SearchFilter.svelte';
import UrlList from '$lib/components/UrlList.svelte';
import { createSearchEngine, type FuseSearchEngine } from '$lib/search';
import type { Bookmark } from '$lib/types';
import type { PageProps } from './$types';

let { data }: PageProps = $props();

let query = $state('');
let engine: FuseSearchEngine | null = $state(null);
let results: Bookmark[] = $state([]);
let showUnreviewedOnly = $state(false);
let allResults: Bookmark[] = $state([]);

// Initialize search functionality
onMount(() => {
  const init = async () => {
    // todo: this is somehow cached. for a long time i still got to see the content.json from the previous implementation
    engine = await createSearchEngine();

    // Read initial query from URL parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q') || '';
      query = initialQuery;

      // Perform initial search
      if (initialQuery.trim()) {
        allResults = engine.search(initialQuery);
      } else {
        allResults = engine.getAllUrlItems();
      }

      filterResults();

      // Handle browser navigation (back/forward)
      const handlePopState = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const newQuery = urlParams.get('q') || '';
        query = newQuery;
        performSearch();
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  };

  init();
});

function performSearch() {
  if (!engine) return;

  if (!query.trim()) {
    allResults = engine.getAllUrlItems();
    // Update URL to remove query parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      history.replaceState({}, '', url);
    }
  } else {
    allResults = engine.search(query);
    // Update URL with current query
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      history.replaceState({}, '', url);
    }
  }

  filterResults();
}

function filterResults() {
  if (showUnreviewedOnly) {
    results = allResults.filter((item) => !item.reviewed);
  } else {
    results = allResults;
  }
}
</script>


<main>
<section>
  <label for="search-input" class="sr-only">Search for content</label>
  <input id="search-input" type="search" bind:value={query} oninput={performSearch} placeholder="Search..."
         class="input w-full"/>
  <div class="my-2">
    <SearchFilter></SearchFilter>
  </div>

  <UrlList items={results}></UrlList>
</section>
</main>
