<!-- ABOUTME: Component for exporting bookmarks to Netscape HTML format -->
<!-- ABOUTME: Displays download button with loading state and generates dated filename -->
<script lang="ts">
	import { exportBookmarksToHTML } from '$lib/utils/export';
	import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

	let exporting = $state(false);

	/**
	 * Generate filename with current date: breader-bookmarks-YYYY-MM-DD.html
	 */
	function getFilename(): string {
		const date = new Date().toISOString().split('T')[0];
		return `breader-bookmarks-${date}.html`;
	}

	/**
	 * Trigger file download using Blob and temporary anchor element.
	 */
	function downloadFile(content: string, filename: string) {
		const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();

		// Cleanup
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function handleExport() {
		exporting = true;

		try {
			const html = await exportBookmarksToHTML();
			const filename = getFilename();
			downloadFile(html, filename);
			toastSuccess('Bookmarks exported successfully');
		} catch (err) {
			toastError(err instanceof Error ? err.message : 'Failed to export bookmarks');
		} finally {
			exporting = false;
		}
	}
</script>

<div class="my-8 p-6 bg-base-200 rounded-box not-prose">
	<h2 class="text-lg font-bold mb-4">Export your bookmarks</h2>
	<p class="text-sm opacity-70 mb-4">
		Download all your bookmarks as an HTML file that can be imported into any browser. Tags will be
		converted to folders.
	</p>

	<button class="btn btn-primary" onclick={handleExport} disabled={exporting}>
		{#if exporting}
			<span class="loading loading-spinner loading-sm"></span>
			Exporting...
		{:else}
			<span class="icon-[ri--download-line]"></span>
			Export Bookmarks
		{/if}
	</button>
</div>
