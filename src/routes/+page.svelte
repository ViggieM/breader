<script lang="ts">
	import { derived } from 'svelte/store';
	import { replaceState } from '$app/navigation';
	import { engine, filters } from '$lib/stores/search.svelte';
	import { db } from '$lib/db';
	import { Bookmark } from '$lib/types';
	import UrlList from '$lib/components/UrlList.svelte';
	import { liveQuery } from 'dexie';

	const lists = liveQuery(() => db.lists.toArray());

	let results = derived([engine, filters], ([$engine, $filters]) => {
		if (!$engine) return [];
		let results = $engine.search($filters.query.trim());

		if ($filters.isReviewed) {
			results = results.filter((b) => !b.isReviewed);
		}
		if ($filters.isStarred) {
			results = results.filter((b) => b.isStarred);
		}

		return results?.map((b) => new Bookmark(b));
	});

	// Update URL when query changes (for bookmarking/sharing)
	function updateURL() {
		const url = new URL(window.location.href);
		if (!$filters.query.trim()) {
			url.searchParams.delete('q');
		} else {
			url.searchParams.set('q', $filters.query);
		}
		replaceState(url, {});
	}

	// Handle adding new lists
	let addListDialog = $state() as HTMLDialogElement;
	let addListForm = $state() as HTMLFormElement;
	async function handleAddList(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const listName = formData.get('name')?.toString() || '';
		if (!listName) {
			return;
		}
		await db.lists.add({ name: listName, created: new Date().toISOString(), modified: null });
		addListForm.reset();
		addListDialog.close();
	}
</script>

<svelte:head>
	<title>Breader</title>
</svelte:head>

<main id="main-content">
	<section>
		<div class="flex gap-2">
			<label for="search-input" class="sr-only">Search for content</label>
			<input
				id="search-input"
				type="search"
				bind:value={$filters.query}
				oninput={updateURL}
				placeholder="Search..."
				class="input w-full"
			/>
			<div class="dropdown dropdown-bottom dropdown-end">
				<div tabindex="0" role="button" class="btn">
					<span class="icon-[ri--add-large-fill]"></span>
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu bg-base-100 rounded-box z-1 w-42 p-2 shadow-sm mt-1"
				>
					<li>
						<a href="/add-bookmark">
							<span class="icon-[ri--bookmark-fill]"></span>
							Add Bookmark
						</a>
					</li>
					<li>
						<button onclick={() => addListDialog.showModal()}
							><span class="icon-[ri--folder-3-line]"></span>
							Add List</button
						>
					</li>
					<li>
						<a href="/add-note">
							<span class="icon-[ri--sticky-note-line]"></span>
							Add Note
						</a>
					</li>
				</ul>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-2 mt-4">
			<a href="list" class="list-card"><span class="icon-[ri--star-line]"></span>Favorites</a>
			<a href="list" class="list-card"><span class="icon-[ri--archive-2-line]"></span>Archive</a>
			<a href="list" class="list-card"><span class="icon-[ri--sticky-note-line]"></span>Notes</a>
			{#each $lists as list (list.id)}
				<a href={`/list/${list.id}`} class="list-card">{list.name}</a>
			{/each}
		</div>

		<div class="mt-4">
			{#if $results.length > 0}
				<h2>Recently added</h2>
				<UrlList items={$results} />
			{:else if $results}
				<p class="flex items-center justify-center gap-2 text-base-content/60">
					No bookmarks found matching your search criteria.
				</p>
			{:else}
				<p class="flex items-center justify-center gap-2">
					<span class="loading loading-spinner loading-lg"></span> Loading bookmarks...
				</p>
			{/if}
		</div>
	</section>
</main>

<!-- You can open the modal using ID.showModal() method -->
<button class="btn" onclick={() => addListDialog.showModal()}>open modal</button>
<dialog bind:this={addListDialog} class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>

		<h3 class="text-lg font-bold">Add a new List</h3>
		<form bind:this={addListForm} id="add-list-form" class="mt-4" onsubmit={handleAddList}>
			<div class="form-group">
				<label class="floating-label input validator input-md w-full">
					<span>List name</span>
					<input
						name="name"
						type="text"
						placeholder="List name"
						required
						pattern=".*\S+.*"
						title="List name cannot be empty or contain only whitespace"
					/>
				</label>
				<p class="validator-hint">List name cannot be empty or contain only whitespace</p>
			</div>
		</form>
		<div class="mt-2 text-right">
			<button class="btn btn-primary" type="submit" form="add-list-form">Save</button>
			<button
				class="btn btn-error"
				onclick={() => {
					addListDialog.close();
					addListForm.reset();
				}}>Cancel</button
			>
		</div>
	</div>
</dialog>
