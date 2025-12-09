<script lang="ts">
	import type { PageProps } from './$types';
	import { db } from '$lib/db';
	import { getFavicon } from '$lib/utils/favicon';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import type { ObjectOption } from 'svelte-multiselect';
	import type { TagData } from '$lib/types';

	const { data }: PageProps = $props();

	let selectedTags = $state([]) as ObjectOption[];
	let saving = $state(false);
	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');

	async function _handleSubmit(evt: SubmitEvent) {
		evt.preventDefault();
		saving = true;

		try {
			// Filter new tags (those without a value) from existing tags
			const newTags = selectedTags.filter(
				(opt) => !('value' in opt) || opt.value === undefined || opt.value === null
			);
			const existingTagIds = selectedTags
				.filter((opt) => 'value' in opt && opt.value !== undefined && opt.value !== null)
				.map((opt) => opt.value as string);

			// Create new tags in the database
			let newTagIds: string[] = [];
			if (newTags.length > 0) {
				const newTagsData: TagData[] = newTags.map(
					(opt) =>
						({
							name: opt.label,
							parentId: null,
							order: 0
						}) as TagData
				);
				// Bulk insert new tags and get their auto-generated IDs
				newTagIds = await db.tags.bulkAdd(newTagsData, { allKeys: true });
			}

			// Create bookmark with all tag IDs (existing + newly created)
			await db.bookmarks.add({
				title: title,
				url: url,
				description: '',
				tags: [...existingTagIds, ...newTagIds],
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
		<TagMultiselect bind:selectedTags />
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
