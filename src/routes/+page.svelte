<script lang="ts">
import Filter from '$lib/components/filter.svelte';
import UrlList from '$lib/components/UrlList.svelte';
import type { PageProps } from './$types';

let { data }: PageProps = $props();

let query = $state('');

function performSearch() {}
</script>


<main>
<section>
  <label for="search-input" class="sr-only">Search for content</label>
  <input id="search-input" type="search" bind:value={query} oninput={performSearch} placeholder="Search..."
         class="input w-full"/>
  <div class="my-2">
    <Filter></Filter>
  </div>

  <UrlList items={data.items}></UrlList>
</section>
</main>
