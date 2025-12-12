<script lang="ts">
	import UrlList from '$lib/components/UrlList.svelte';
	import SearchBar, { results } from '$lib/components/SearchBar.svelte';
	import NavigationMenu from '$lib/components/NavigationMenu.svelte';
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar />

	<NavigationMenu />
</main>
