<!-- ABOUTME: Reusable favicon component with IndexedDB caching and async resolution -->
<!-- ABOUTME: Uses {#await} blocks for loading states and falls back to Google S2 API -->

<script lang="ts">
	import { resolveFavicon } from '$lib/utils/faviconResolver';

	interface Props {
		/** Bookmark URL to get favicon for */
		url: string;
		/** CSS classes for the img element */
		class?: string;
		/** Preset sizes: sm (12px), md (16px), lg (24px) */
		size?: 'sm' | 'md' | 'lg';
	}

	let { url, class: className = '', size = 'md' }: Props = $props();

	const sizeClasses = {
		sm: 'w-3 h-3',
		md: 'w-4 h-4',
		lg: 'w-6 h-6'
	};

	let sizeClass = $derived(sizeClasses[size]);

	// Use $derived to memoize the promise based on URL
	let faviconPromise = $derived(resolveFavicon(url));
</script>

{#await faviconPromise}
	<!-- Empty placeholder while loading -->
	<span class="{sizeClass} inline-block"></span>
{:then faviconData}
	{#if faviconData}
		<img
			src={faviconData}
			alt=""
			draggable="false"
			loading="lazy"
			class="{sizeClass} {className} shrink-0"
		/>
	{:else}
		<!-- No favicon available, show empty placeholder -->
		<span class="{sizeClass} inline-block"></span>
	{/if}
{:catch}
	<!-- Error state - show empty placeholder -->
	<span class="{sizeClass} inline-block"></span>
{/await}
