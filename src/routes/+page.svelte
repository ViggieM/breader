<script lang="ts">
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { replaceState } from '$app/navigation';
import SearchFilter from '$lib/components/SearchFilter.svelte';
import UrlList from '$lib/components/UrlList.svelte';
import {
  bookmarkStore,
  type SearchOptions,
} from '$lib/stores/bookmarks.svelte';
import type { Bookmark } from '$lib/types';
import type { PageProps } from './$types';

let { data }: PageProps = $props();

let query = $state('');
let searchOptions: SearchOptions = $state({
  reviewed: false,
});
let results: Bookmark[] = $state([]);

// Effect to update search engine when bookmarks change (moved out of derived)
$effect(() => {
  results = [...bookmarkStore.searchBookmarks(query, searchOptions)];
});

// Update URL when query changes (for bookmarking/sharing)
function updateURL() {
  if (browser) {
    const url = new URL(window.location.href);
    if (!query.trim()) {
      url.searchParams.delete('q');
    } else {
      url.searchParams.set('q', query);
    }
    replaceState(url, {});
  }
}
</script>


<main>
<section>
  <label for="search-input" class="sr-only">Search for content</label>
  <input id="search-input" type="search" bind:value={query} oninput={updateURL} placeholder="Search..."
         class="input w-full"/>
  <div class="my-2">
    <SearchFilter bind:searchOptions></SearchFilter>
  </div>

  {#if results}
    <UrlList items={results}></UrlList>
  {:else}
    <p class="flex items-center justify-center gap-2"><span class="loading loading-spinner loading-lg"></span> Loading bookmarks...</p>
  {/if}
</section>
</main>
