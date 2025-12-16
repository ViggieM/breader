<script lang="ts">
	import type { PageProps } from './$types';
	import { createBookmark } from '$lib/db/bookmarks';
	import { getFavicon } from '$lib/utils/favicon';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import type { ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave } from '$lib/utils/tags';
	import { BookmarkStatus } from '$lib/types';
	import BookmarkStatusSelect from '$lib/components/BookmarkStatusSelect.svelte';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

	const { data }: PageProps = $props();

	let selectedTags = $state([]) as ObjectOption[];
	let saving = $state(false);
	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');
	let status = $state(BookmarkStatus.WANT_TO_READ) as BookmarkStatus;
	let disabled = $derived(saving || !url);

	async function _handleSubmit() {
		saving = true;

		try {
			// Process tags: create new ones and get all tag IDs
			const { allTagIds } = await processTagsForSave(selectedTags);

			// Create bookmark with all tag IDs
			const id = await createBookmark({
				title,
				url,
				description: '',
				tags: allTagIds,
				status,
				isStarred: false
			});

			toastSuccess('Bookmark created');

			// trigger a fetch of the metadata.
			// This request is intercepted and handled by the service worker
			await fetch(`/api/fetch-metadata`, {
				method: 'POST',
				body: JSON.stringify({ id, url }),
				headers: {
					'Content-Type': 'application/json'
				}
			});

			window.close();
		} catch (error) {
			toastError('Failed to create bookmark');
			console.error('Error saving bookmark:', error);
		} finally {
			saving = false;
		}
	}
</script>

<form class="flex-1 md:flex-none space-y-4 pb-20 p-2" id="add-bookmark">
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
	<div class="form-actions flex flex-col gap-2">
		<button class="btn btn-error" onclick={() => window.close()}> Cancel </button>
		<BookmarkStatusSelect
			bind:status
			bind:saving
			bind:disabled
			handleClick={_handleSubmit}
			position="top"
		/>
	</div>
</div>
