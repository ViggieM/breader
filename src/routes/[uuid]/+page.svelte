<script lang="ts">
	import type { Bookmark } from '$lib/types';
	import { formatDate } from '$lib';

	const { data } = $props();
	const bookmark: Bookmark = data.bookmark;

	function openUrl() {
		window.open(bookmark.url, '_blank');
	}
</script>

<svelte:head>
	<title>{bookmark.title} - Breader</title>
</svelte:head>

<div class="container mx-auto max-w-2xl p-4">
	<header class="flex items-center gap-3">
		<img src={bookmark.faviconUrl} alt="Favicon" />
		<h1 class="text-lg font-medium flex-1 mt-0">{bookmark.title}</h1>
		{#if bookmark.isStarred}
			<div class="text-warning">⭐</div>
		{/if}
	</header>

	<dl class="space-y-4">
		<div>
			<dt class="text-sm font-medium opacity-70 mb-1">URL</dt>
			<dd class="flex gap-2">
				<input
					type="text"
					value={bookmark.url}
					class="input input-sm input-bordered flex-1"
					readonly
				/>
				<button onclick={openUrl} class="btn btn-sm btn-primary">Open</button>
			</dd>
		</div>

		{#if bookmark.description}
			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Description</dt>
				<dd class="text-sm opacity-75">{bookmark.description}</dd>
			</div>
		{/if}

		<div>
			<dt class="text-sm font-medium opacity-70 mb-1">Created</dt>
			<dd class="text-sm">{formatDate(bookmark.created)}</dd>
		</div>

		{#if bookmark.modified}
			<div>
				<dt class="text-sm font-medium opacity-70 mb-1">Modified</dt>
				<dd class="text-sm">{formatDate(bookmark.modified)}</dd>
			</div>
		{/if}

		<div>
			<dt class="text-sm font-medium opacity-70 mb-1">Status</dt>
			<dd>
				<div class="badge {bookmark.isReviewed ? 'badge-success' : 'badge-warning'}">
					{bookmark.isReviewed ? 'Reviewed' : 'Unreviewed'}
				</div>
			</dd>
		</div>
	</dl>
</div>
