<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/db';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let title = $state(data.articleData.title || '');
	let url = $state(data.articleData.url || '');
	let description = $state(data.articleData.description || '');
	let tags = $state('');
	let saving = $state(false);
	let isReviewed = $state(false);
	let isStarred = $state(false);

	async function _handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		saving = true;

		try {
			const id = await db.bookmarks.add({
				title: (formData.get('title') as string) || 'Untitled',
				url: formData.get('url') as string,
				description: (formData.get('description') as string) || '',
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

			// navigate to the newly created bookmark
			await goto(`/#${id}`);
		} catch (error) {
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
		<small>This is the description shown when you click on a bookmark on the index page</small>
	</div>

	<div class="form-group">
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={isReviewed} />
			<span>Mark as reviewed</span>
		</label>
	</div>

	<div class="form-group">
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" class="checkbox checkbox-sm" bind:checked={isStarred} />
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

<div class="fixed bottom-0 left-0 right-0 p-2 md:static md:p-0">
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
