<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import type { PageProps } from './$types';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import type { ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave } from '$lib/utils/tags';
	import { BookmarkStatus } from '$lib/types';

	const { data }: PageProps = $props();

	let url = $state(data.articleData.url || '');
	let selectedTags = $state([]) as ObjectOption[];
	let saving = $state(false);
	let status = $state(BookmarkStatus.WANT_TO_READ) as BookmarkStatus;
	let isStarred = $state(false);

	async function _handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		const url = formData.get('url') as string;

		saving = true;

		try {
			// Process tags: create new ones and get all tag IDs
			const { allTagIds } = await processTagsForSave(selectedTags);

			// Create bookmark with all tag IDs
			const id = await db.bookmarks.add({
				url,
				tags: allTagIds,
				created: new Date().toISOString(),
				modified: null,
				keywords: [],
				status,
				isStarred
			});

			// trigger a fetch of the metadata.
			// This request is intercepted and handled by the service worker, so we don't need to await here
			fetch(`/api/fetch-metadata`, {
				method: 'POST',
				body: JSON.stringify({ id, url }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			// navigate to the newly created bookmark
			// use replaceState to prevent browser back button from returning to this form
			await goto(`/${id}`, { replaceState: true });
		} catch (error) {
			// todo: add a notification here instead of just a console error
			console.error('Error saving bookmark:', error);
		} finally {
			saving = false;
		}
	}
</script>

<form
	onsubmit={_handleSubmit}
	class="flex-1 md:flex-none space-y-4 pb-20 md:pb-4"
	id="add-bookmark"
>
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
		<label for="status-select" class="text-sm font-medium opacity-70 mb-1">Status</label>
		<select id="status-select" bind:value={status} class="select select-sm w-full">
			<option value={BookmarkStatus.WANT_TO_READ}>Want to Read</option>
			<option value={BookmarkStatus.READING}>Currently Reading</option>
			<option value={BookmarkStatus.READ}>Read</option>
		</select>
	</div>

	<div class="form-group">
		<label class="flex items-center gap-2 text-sm" for="starred-checkbox">
			<input
				id="starred-checkbox"
				type="checkbox"
				class="checkbox checkbox-sm"
				bind:checked={isStarred}
			/>
			<span>Mark as starred</span>
		</label>
	</div>

	<div class="form-group">
		<dt class="text-sm font-medium opacity-70 mb-1">Tags</dt>
		<TagMultiselect bind:selectedTags />
	</div>
</form>

<div
	class="sticky bottom-0 left-0 right-0 p-2 md:static md:p-0 bg-base-100 border-t border-base-300 md:border-0"
	style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
>
	<div class="form-actions flex gap-2">
		<a href="/" type="button" class="btn btn-error flex-1 md:flex-none"> Cancel </a>
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
