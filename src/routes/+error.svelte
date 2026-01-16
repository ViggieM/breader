<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import svg404 from '$lib/assets/404.svg?raw';
	import svg500 from '$lib/assets/500.svg?raw';

	// Get error details
	const status = $derived(page.status);
	const message = $derived(page.error?.message || 'Something went wrong');

	// Error-specific content
	const is404 = $derived(status === 404);
	const is500 = $derived(status >= 500);

	// Dynamic content based on error type
	const title = $derived(is404 ? 'Page Not Found' : is500 ? 'Server Error' : `Error ${status}`);

	const description = $derived(
		is404
			? 'This page is like a bookmark to nowhere – it seems to have gotten lost in the digital library!'
			: is500
				? 'Our servers are having trouble processing your request. Please try again later.'
				: message
	);
</script>

<svelte:head>
	<title>{title} - Breader</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!--<div class="flex flex-col">-->

<!-- Main error content -->
<main id="main-content" class="flex-1 flex items-center justify-center p-4">
	<div class="text-center max-w-2xl mx-auto space-y-8">
		<!-- Error illustration -->
		<div class="flex flex-col items-center justify-start gap-6">
			<img src="/icons/icon-192.png" alt="" class="size-32" role="presentation" />
			{#if is404}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<div class="w-72">{@html svg404}</div>
			{:else}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<div class="w-72">{@html svg500}</div>
			{/if}

			<h1 class="sr-only">
				{status}
			</h1>
			<h2 class="text-2xl sm:text-3xl font-semibold">
				{title}
			</h2>
		</div>

		<!-- Description -->
		<p class="text-lg text-base-content/80 leading-relaxed">
			{description}
		</p>

		<!-- Action buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<a href={resolve('/')} class="btn btn-primary btn-lg">
				<span class="icon-[material-symbols--home]"></span>
				Go Home
			</a>
		</div>
	</div>
</main>
