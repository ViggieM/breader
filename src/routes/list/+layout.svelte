<script lang="ts">
	import SearchBar from '$lib/components/SearchBar.svelte';

	let { children } = $props();
</script>

<main id="main-content">
	<SearchBar />

	{@render children?.()}
</main>
