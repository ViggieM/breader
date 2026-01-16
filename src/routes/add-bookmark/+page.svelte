<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { createBookmark } from '$lib/db/bookmarks';
	import type { PageProps } from './$types';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import BookmarkStatusSelect from '$lib/components/BookmarkStatusSelect.svelte';
	import type { ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave } from '$lib/utils/tags';
	import { BookmarkStatus } from '$lib/types';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

	const { data }: PageProps = $props();

	// Initialize form state from props (intentional one-time capture)
	let url = $state(untrack(() => data.articleData.url || ''));
	let selectedTags = $state([]) as ObjectOption[];
	let saving = $state(false);
	let status = $state(BookmarkStatus.WANT_TO_READ) as BookmarkStatus;
	let isStarred = $state(false);
	let disabled = $derived(saving);

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
			const id = await createBookmark({
				url,
				tags: allTagIds,
				status,
				isStarred
			});

			toastSuccess('Bookmark created');

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
			await goto(resolve(`/bookmark/${id}`), { replaceState: true });
		} catch (error) {
			toastError('Failed to create bookmark');
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
				type="url"
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

	<div class="form-group max-w-52">
		<span class="text-sm font-medium opacity-70 mb-1">Status</span>
		<BookmarkStatusSelect
			bind:status
			bind:saving
			bind:disabled
			handleClick={() => {}}
			position="bottom"
			size="small"
		/>
	</div>

	<div class="form-group mt-6">
		<label class="flex items-center gap-2 text-sm" for="starred-checkbox">
			<input
				id="starred-checkbox"
				type="checkbox"
				class="checkbox checkbox-sm"
				bind:checked={isStarred}
			/>
			<span>Add to Favorites</span>
		</label>
	</div>
</form>

<div
	class="sticky bottom-0 left-0 right-0 p-2 md:static md:p-0 bg-base-100 border-t border-base-300 md:border-0 mt-8"
	style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
>
	<div class="form-actions flex gap-2">
		<a href={resolve('/')} type="button" class="btn btn-error flex-1 md:flex-none"> Cancel </a>
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
