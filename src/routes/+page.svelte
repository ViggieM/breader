<script>
let query = $state('');

function performSearch() {}
</script>

<section class="mx-auto max-w-2xl">
  <label for="search-input" class="sr-only">Search for content</label>
  <input id="search-input" type="search" bind:value={query} oninput={performSearch} placeholder="Search..."
         class="w-full"/>
  <details class="text-right mt-2">
    <summary class="flex items-center gap-2 cursor-pointer">
      <span class="ml-auto icon-[mi--filter]"></span> Filter</summary>
    <div class="bg-white p-2 rounded mt-2">
      <label class="flex items-center text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" class="mr-2 rounded">
      Ungelesen
    </label>
    </div>
  </details>
</section>
