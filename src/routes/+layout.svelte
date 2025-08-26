<script lang="ts">
	import '../styles/app.css';
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { closeDetailsOnOutsideClick } from '$lib';
	import Logo from '$lib/assets/logo.svg?raw';
	import MainMenu from '$lib/components/MainMenu.svelte';
	import { handleBeforeInstallPrompt } from '$lib/stores/installPWA.svelte.js';
	import { getTheme } from '$lib/stores/theme.svelte';

	let { children, data } = $props();
	let { session, supabase } = data;
	const theme = getTheme();

	$effect(() => {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme.current);
		}
	});

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<title>Breader</title>
	<link rel="manifest" href="/manifest.json" />

	<!-- Additional meta tags for better PWA support -->
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Breader" />
	<link rel="apple-touch-icon" href="/icons/icon-192.png" />
</svelte:head>

<svelte:window
	onclick={closeDetailsOnOutsideClick}
	onbeforeinstallprompt={handleBeforeInstallPrompt}
/>

<!-- Skip navigation for accessibility -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary"
>
	Skip to main content
</a>

<header>
	<div>
		<a href="/" class="text-transparent" title="Breader home">Breader home</a>
		<img src="/icons/icon-48.png" alt="" class="size-8" role="presentation" />
		<div class="h-6 w-auto [&>svg]:h-full [&>svg]:w-auto">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html Logo}
		</div>
	</div>
	<MainMenu></MainMenu>
</header>

{@render children?.()}

<footer></footer>
