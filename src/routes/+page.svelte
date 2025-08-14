<script>
let query = $state('');

function performSearch() {}
</script>

<section class="mx-auto max-w-2xl">
  <label for="search-input" class="sr-only">Search for content</label>
  <input id="search-input" type="search" bind:value={query} oninput={performSearch} placeholder="Search..." class="w-full mb-4"/>
</section>
