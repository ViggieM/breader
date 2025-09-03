<script lang="ts">
	import { db } from '$lib/db';
	import SelectTag from './SelectTag.svelte';

	interface Props {
		onSuccess?: (newTagId: string) => void;
	}

	const { onSuccess }: Props = $props();

	let name = $state('');
	let selectedParentId = $state<string | null>(null);
	let saving = $state(false);

	async function _handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		saving = true;

		try {
			const newTagId = await db.tags.add({
				name: (formData.get('name') as string) || 'Untitled',
				parentId: selectedParentId,
				order: 0
			});

			// Clear form after successful submission
			name = '';
			selectedParentId = null;

			// Call success callback if provided (for closing modal, etc.)
			if (onSuccess) {
				onSuccess(newTagId);
			}
		} catch (error) {
			console.error('Error saving tag:', error);
		} finally {
			saving = false;
		}
	}
</script>

<!-- ABOUTME: TagForm component for creating new tags with name input only -->
<!-- ABOUTME: Follows same patterns as add-bookmark form but stays on page after submission -->

<form onsubmit={_handleSubmit} class="flex-1 md:flex-none space-y-4 pb-20 md:pb-4" id="add-tag">
	<div class="form-group">
		<label class="floating-label">
			<span>Tag Name</span>
			<input
				name="name"
				type="text"
				bind:value={name}
				placeholder="Tag name"
				class="input input-md w-full"
				required
			/>
		</label>
	</div>

	<div class="form-group">
		<div class="label">
			<span class="label-text">Parent Tag</span>
		</div>
		<SelectTag bind:selectedParentId />
	</div>
</form>

<div
	class="sticky bottom-0 left-0 right-0 p-2 md:static md:p-0 bg-base-100 border-t border-base-300 md:border-0"
	style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));"
>
	<div class="form-actions flex gap-2">
		<button type="button" class="btn btn-error flex-1 md:flex-none" onclick={() => onSuccess?.('')}>
			Cancel
		</button>
		<button
			type="submit"
			disabled={saving || !name}
			class="btn btn-success flex-1 md:flex-none"
			form="add-tag"
		>
			{saving ? 'Saving...' : 'Save Tag'}
		</button>
	</div>
</div>
