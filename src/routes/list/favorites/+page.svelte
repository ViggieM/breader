<script lang="ts" module>
	import { favoriteBookmarks, FuseSearchEngine } from '$lib/stores/search.svelte';
	import { derived, writable } from 'svelte/store';
	import { BookmarkStatus } from '$lib/types';
	import { createNavigationData } from '$lib/stores/navigation.svelte';

	const filters = writable({
		query: '',
		showUnread: false,
		isStarred: false
	});

	const engine = derived(
		favoriteBookmarks,
		($bookmarksData) => new FuseSearchEngine($bookmarksData)
	);

	const searchResults = derived([engine, filters], ([$engine, $filters]) => {
		if (!$engine) return [];
		let results = $engine.search($filters.query.trim());

		if ($filters.showUnread) {
			results = results.filter(
				(b) => b.status === BookmarkStatus.WANT_TO_READ || b.status === BookmarkStatus.READING
			);
		}
		if ($filters.isStarred) {
			results = results.filter((b) => b.isStarred);
		}

		return results;
	});

	const data = createNavigationData(searchResults);
</script>

<script lang="ts">
	import SearchBar from '$lib/components/SearchBar.svelte';
	import NavigationMenu from '$lib/components/NavigationMenu.svelte';
</script>

<svelte:head>
	<title>Favorites | Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar {filters} placeholder="Search Favorites..." />

	<NavigationMenu bookmarksLiveData={data} />
</main>
