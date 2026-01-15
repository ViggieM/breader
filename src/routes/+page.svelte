<script lang="ts" module>
	import { resolve } from '$app/paths';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import TagMenu from '$lib/components/TagMenu.svelte';
	import { createTagMenuData } from '$lib/stores/tags.svelte';
	import { bookmarksData, FuseSearchEngine } from '$lib/stores/search.svelte';
	import { derived, writable } from 'svelte/store';
	import { BookmarkStatus } from '$lib/types';
	import QuickActions from '$lib/components/QuickActions.svelte';

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

	const data = createTagMenuData(searchResults);
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
			<a href={resolve('/list/favorites')} aria-label="View favorite bookmarks">
				<span class="icon-[ri--star-line] shrink-0" aria-hidden="true"></span>
				Favorites
			</a>
		</li>
		<li>
			<a href={resolve('/list/archived')} aria-label="View archived bookmarks">
				<span class="icon-[ri--archive-2-line] shrink-0" aria-hidden="true"></span>
				Archive
			</a>
		</li>
		<li>
			<a href={resolve('/list/notes')} aria-label="View notes">
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

<div class="fixed right-4 bottom-4 md:hidden">
	<QuickActions class="btn btn-primary rounded-full size-12" />
</div>
