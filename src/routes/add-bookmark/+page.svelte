<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let url = $state(data.articleData.url || '');
	let tags = $state('');
	let saving = $state(false);
	let isReviewed = $state(false);
	let isStarred = $state(false);

	async function _handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		const url = formData.get('url') as string;

		saving = true;

		try {
			const id = await db.bookmarks.add({
				url,
				tags: ((formData.get('tags') as string) || '')
					.split(',')
					.map((tag) => tag.trim())
					.filter((tag) => tag.length > 0),
				created: new Date().toISOString(),
				modified: null,
				keywords: [],
				isReviewed,
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
		<label class="flex items-center gap-2 text-sm" for="reviewed-checkbox">
			<input
				id="reviewed-checkbox"
				type="checkbox"
				class="checkbox checkbox-sm"
				bind:checked={isReviewed}
			/>
			<span>Mark as reviewed</span>
		</label>
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
		<label class="floating-label">
			<span>Tags</span>
			<input
				name="tags"
				type="text"
				bind:value={tags}
				placeholder="tag1, tag2, tag3"
				class="input input-md w-full"
			/>
		</label>
		<small>Separate tags with commas</small>
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
