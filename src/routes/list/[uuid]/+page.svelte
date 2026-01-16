<script lang="ts" module>
	import { bookmarksData, FuseSearchEngine } from '$lib/stores/search.svelte';
	import { derived, writable } from 'svelte/store';
	import { descendantMap } from '$lib/stores/tags.svelte.js';
	import { BookmarkStatus } from '$lib/types';
	import { createTagMenuData } from '$lib/stores/tags.svelte';

	const filters = writable({
		query: '',
		showUnread: false,
		isStarred: false
	});
</script>

<script lang="ts">
	import { Tag } from '$lib/types';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TagMenu from '$lib/components/TagMenu.svelte';

	const { data } = $props();
	let tag: Tag = $derived(data.tag);

	// Filter bookmarks by tag and descendants
	const tagBookmarks = derived([bookmarksData, descendantMap], ([$bookmarks, $descendantMap]) => {
		const descendants = $descendantMap.get(tag.id) || [];
		const tags = [tag.id, ...descendants];
		return $bookmarks.filter(
			(b) => b.tags && b.tags.some((bookmarkTag) => tags.includes(bookmarkTag))
		);
	});

	// Create search engine for tag bookmarks
	const engine = derived(tagBookmarks, ($tagBookmarks) => new FuseSearchEngine($tagBookmarks));

	// Apply search filters
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

	// Create navigation data from filtered results
	const navigationData = createTagMenuData(searchResults);
</script>

<svelte:head>
	<title>{tag.name} | Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar {filters} />

	<TagMenu bookmarksLiveData={navigationData} hideTagsWithoutBookmarks={true} />
</main>
