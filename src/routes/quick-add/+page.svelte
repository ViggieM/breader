<script lang="ts">
	import MultiSelectTags from '$lib/components/MultiSelectTags.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import { db } from '$lib/db';
	import { getFavicon } from '$lib/utils/favicon';

	const { data }: PageProps = $props();

	const selectedTags = new SvelteSet<string>();
	let saving = $state(false);
	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');

	async function _handleSubmit(evt: SubmitEvent) {
		evt.preventDefault();
		saving = true;

		try {
			await db.bookmarks.add({
				title: title,
				url: url,
				description: '',
				tags: Array.from(selectedTags),
				created: new Date().toISOString(),
				modified: null,
				keywords: [],
				isReviewed: false,
				isStarred: false
			});
			window.close();
		} finally {
			saving = false;
		}
	}
</script>

<form onsubmit={_handleSubmit} class="flex-1 md:flex-none space-y-4 pb-20 p-2" id="add-bookmark">
	<header class="flex items-center gap-3">
		<img src={getFavicon(url)} class="size-4" alt="Favicon" />
		<h1 class="text-lg font-medium flex-1 mt-0" contenteditable="true" bind:innerText={title}></h1>
	</header>

	<div class="form-group">
		<label class="floating-label">
			<span>URL</span>
			<input
				name="url"
				type="text"
				bind:value={url}
				placeholder="https://example.com"
				class="input input-md w-full"
				required
				aria-describedby="url-status"
			/>
		</label>
	</div>

	<div class="form-group">
		<MultiSelectTags {selectedTags} />
	</div>
</form>

<div
	class="sticky bottom-0 left-0 right-0 p-2 md:static md:p-0 bg-base-100 border-t border-base-300 md:border-0"
	style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
>
	<div class="form-actions flex gap-2">
		<button class="btn btn-error flex-1 md:flex-none" onclick={() => window.close()}>
			Cancel
		</button>
		<button
			type="submit"
			disabled={saving || !url}
			class="btn btn-success flex-1 md:flex-none"
			form="add-bookmark"
		>
			{saving ? 'Saving...' : 'Save Bookmark'}
		</button>
	</div>
</div>
