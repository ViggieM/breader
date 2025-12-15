<script lang="ts">
	import SearchBar from '$lib/components/SearchBar.svelte';
	import NavigationMenu from '$lib/components/NavigationMenu.svelte';
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<SearchBar />
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
	<NavigationMenu />
</main>
