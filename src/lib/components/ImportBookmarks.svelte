<script lang="ts">
	import { processBookmarkImport, type ImportResult } from '$lib/utils/import';
	import { toastSuccess, toastError, toastInfo } from '$lib/stores/notifications.svelte';

	let importing = $state(false);
	let result = $state<ImportResult | null>(null);
	let fileInput: HTMLInputElement;

	async function handleSelectBookmarksHTML(evt: Event) {
		const target = evt.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		importing = true;
		result = null;

		const reader = new FileReader();

		reader.onload = async () => {
			try {
				const html = reader.result as string;
				const importResult = await processBookmarkImport(html);
				result = importResult;

				// Show toast notifications based on result
				if (importResult.successCount > 0) {
					toastSuccess(`Successfully imported ${importResult.successCount} bookmark(s)`);
				}
				if (importResult.skippedCount > 0) {
					toastInfo(`Skipped ${importResult.skippedCount} duplicate(s)`);
				}
				if (importResult.errors.length > 0) {
					toastError(`Failed to import ${importResult.errors.length} bookmark(s)`);
				}
			} catch (err) {
				toastError(err instanceof Error ? err.message : 'Failed to import bookmarks');
			} finally {
				importing = false;
			}
		};

		reader.readAsText(file);

		// Clear file input for re-use
		target.value = '';
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	class="hidden"
	name="import-bookmarks"
	id="import-bookmarks"
	accept=".html"
	disabled={importing}
	aria-label="Import bookmarks HTML file"
	onchange={handleSelectBookmarksHTML}
/>

<label for="import-bookmarks" class="flex justify-between cursor-pointer">
	{#if importing}
		<span class="text-sm">Importing bookmarks...</span>
	{:else}
		Import Bookmarks <span class="icon-[ri--download-2-line]"></span>
	{/if}
</label>
