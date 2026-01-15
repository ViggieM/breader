<script lang="ts">
	import { replaceState } from '$app/navigation';
	import type { Writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import QuickActions from './QuickActions.svelte';

	interface Props {
		filters: Writable<{ query: string }>;
		placeholder?: string;
	}

	let { filters, placeholder }: Props = $props();

	// Search input reference
	let searchInput = $state() as HTMLInputElement;

	// Update URL when query changes (for bookmarking/sharing)
	function updateURL() {
		const url = new URL(window.location.href);
		if (!$filters.query.trim()) {
			url.searchParams.delete('q');
		} else {
			url.searchParams.set('q', $filters.query);
		}
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, {});
	}

	// Keyboard shortcut: Ctrl+K (or Cmd+K on Mac) to focus search
	onMount(() => {
		function handleKeydown(event: KeyboardEvent) {
			if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
				event.preventDefault();
				searchInput?.focus();
			}
		}

		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="flex gap-2">
	<label for="search-input" class="sr-only">Search for content</label>
	<input
		bind:this={searchInput}
		id="search-input"
		type="search"
		bind:value={$filters.query}
		oninput={updateURL}
		placeholder={placeholder || 'Search...'}
		class="input w-full"
	/>
	<div class="hidden md:block">
		<QuickActions class="btn" />
	</div>
</div>
