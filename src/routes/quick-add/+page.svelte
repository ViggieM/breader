<script lang="ts">
	import { tagsData } from '$lib/stores/search.svelte';
	import MultiSelectTags from '$lib/components/MultiSelectTags.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import { db } from '$lib/db';

	const { data }: PageProps = $props();

	const selectedTags = new SvelteSet<string>();
	let saving = $state(false);
	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');
	let description = $state(data.articleData.description || '');

	async function _handleSubmit(evt: SubmitEvent) {
		evt.preventDefault();
		saving = true;

		try {
			await db.bookmarks.add({
				title: title,
				url: url,
				description: description,
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
	<div class="form-group">
		<label class="floating-label">
			<span>Title</span>
			<input
				name="title"
				type="text"
				bind:value={title}
				placeholder="Bookmark title"
				class="input input-md w-full"
			/>
		</label>
	</div>

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
		<label class="floating-label">
			<span>Description</span>
			<textarea
				name="description"
				bind:value={description}
				placeholder="Description (optional)"
				rows="3"
				class="textarea input-md w-full"
			></textarea>
		</label>
	</div>

	<div class="form-group">
		<MultiSelectTags tags={$tagsData} {selectedTags} />
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
