<script lang="ts" module>
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TagMenu from '$lib/components/TagMenu.svelte';
	import { createNavigationData } from '$lib/stores/navigation.svelte';
	import { bookmarksData, FuseSearchEngine } from '$lib/stores/search.svelte';
	import { derived, writable } from 'svelte/store';
	import { BookmarkStatus } from '$lib/types';

	const filters = writable({
		query: '',
		showUnread: false,
		isStarred: false
	});

	const engine = derived(bookmarksData, ($bookmarksData) => new FuseSearchEngine($bookmarksData));

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
	let hideTagsWithoutBookmarks = $derived($filters.query.trim() !== '');
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar {filters} />
	<ul class="menu rounded-box w-full p-0 mt-4">
		<!-- Static top-level links -->
		<li>
			<a href="/list/favorites" aria-label="View favorite bookmarks">
				<span class="icon-[ri--star-line] shrink-0" aria-hidden="true"></span>
				Favorites
			</a>
		</li>
		<li>
			<a href="/list/archived" aria-label="View archived bookmarks">
				<span class="icon-[ri--archive-2-line] shrink-0" aria-hidden="true"></span>
				Archive
			</a>
		</li>
		<li>
			<a href="/list/notes" aria-label="View notes">
				<span class="icon-[ri--sticky-note-line] shrink-0" aria-hidden="true"></span>
				Notes
			</a>
		</li>
	</ul>
	<TagMenu
		bookmarksLiveData={data}
		class="border-t border-base-300 mt-4"
		{hideTagsWithoutBookmarks}
	/>
</main>
