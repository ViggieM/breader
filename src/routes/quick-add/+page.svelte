<script lang="ts">
	import type { PageProps } from './$types';
	import { db } from '$lib/db';
	import { getFavicon } from '$lib/utils/favicon';
	import TagMultiselect from '$lib/components/TagMultiselect.svelte';
	import type { ObjectOption } from 'svelte-multiselect';
	import { processTagsForSave } from '$lib/utils/tags';
	import { BookmarkStatus } from '$lib/types';

	const { data }: PageProps = $props();

	let selectedTags = $state([]) as ObjectOption[];
	let saving = $state(false);
	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');
	let status = $state(BookmarkStatus.WANT_TO_READ) as BookmarkStatus;

	async function _handleSubmit() {
		saving = true;

		try {
			// Process tags: create new ones and get all tag IDs
			const { allTagIds } = await processTagsForSave(selectedTags);

			// Create bookmark with all tag IDs
			const id = await db.bookmarks.add({
				title: title,
				url: url,
				description: '',
				tags: allTagIds,
				created: new Date().toISOString(),
				modified: null,
				keywords: [],
				status,
				isStarred: false
			});

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
		<div class="flex shadow-md">
			<button
				type="submit"
				disabled={saving || !url}
				class="btn btn-warning grow rounded-r-none border-r-0 shadow-none"
				onclick={() => {
					status = BookmarkStatus.WANT_TO_READ;
					_handleSubmit();
				}}
			>
				{saving ? 'Saving...' : 'Want to read'}
			</button>
			<div class="dropdown dropdown-top dropdown-end">
				<div tabindex="0" role="button" class="btn btn-warning rounded-l-none shadow-none">
					<span class="icon-[ri--arrow-down-s-line]"></span>
				</div>
				<ul
					tabindex="-1"
					class="dropdown-content menu bg-base-100 rounded-box z-1 mb-2 p-0 shadow-sm gap-2"
				>
					<li>
						<button
							type="submit"
							disabled={saving || !url}
							class="btn btn-neutral w-full"
							onclick={() => {
								status = BookmarkStatus.ARCHIVED;
								_handleSubmit();
							}}
						>
							{saving ? 'Saving...' : 'Archive'}
						</button>
					</li>
					<li>
						<button
							type="submit"
							disabled={saving || !url}
							class="btn btn-info w-full"
							onclick={() => {
								status = BookmarkStatus.READING;
								_handleSubmit();
							}}
						>
							{saving ? 'Saving...' : 'Currently reading'}
						</button>
					</li>
					<li>
						<button
							type="submit"
							disabled={saving || !url}
							class="btn btn-success w-full"
							onclick={() => {
								status = BookmarkStatus.READ;
								_handleSubmit();
							}}
						>
							{saving ? 'Saving...' : 'Read'}
						</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>

<style>
	.dropdown-content {
		width: calc(100vw - 1rem);
	}
</style>
