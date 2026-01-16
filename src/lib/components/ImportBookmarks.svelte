<!-- ABOUTME: Component for importing bookmarks from browser HTML exports -->
<!-- ABOUTME: Displays file input with DaisyUI styling and import results -->
<script lang="ts">
	import { processBookmarkImport, type ImportResult } from '$lib/utils/import';
	import { toastSuccess, toastError, toastInfo } from '$lib/stores/notifications.svelte';

	let importing = $state(false);
	let result = $state<ImportResult | null>(null);

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

<div class="my-8 p-6 bg-base-200 rounded-box not-prose">
	<h2 class="text-lg font-bold mb-4">Import your bookmarks file</h2>
	<p class="text-sm opacity-70 mb-4">
		Once you have exported your bookmarks as an HTML file, select it below.
	</p>

	<fieldset class="fieldset">
		<legend class="fieldset-legend">Select bookmarks HTML file</legend>
		<input
			type="file"
			class="file-input file-input-bordered w-full max-w-xs"
			accept=".html"
			disabled={importing}
			aria-label="Import bookmarks HTML file"
			onchange={handleSelectBookmarksHTML}
		/>
	</fieldset>

	{#if importing}
		<div class="mt-4 flex items-center gap-2">
			<span class="loading loading-spinner loading-sm"></span>
			<span>Importing bookmarks...</span>
		</div>
	{/if}

	{#if result}
		<div class="mt-4 space-y-2">
			{#if result.successCount > 0}
				<div class="alert alert-success">
					<span class="icon-[ri--check-line]"></span>
					<span>Successfully imported {result.successCount} bookmark(s)</span>
				</div>
			{/if}
			{#if result.skippedCount > 0}
				<div class="alert alert-info">
					<span class="icon-[ri--information-line]"></span>
					<span>Skipped {result.skippedCount} duplicate(s)</span>
				</div>
			{/if}
			{#if result.errors.length > 0}
				<div class="alert alert-error">
					<span class="icon-[ri--error-warning-line]"></span>
					<span>Failed to import {result.errors.length} bookmark(s)</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
