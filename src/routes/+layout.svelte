<script lang="ts">
	import '../styles/app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/Logo.svelte';
	import MainMenu from '$lib/components/MainMenu.svelte';
	import { handleBeforeInstallPrompt } from '$lib/stores/installPWA.svelte.js';
	import { initializeTheme } from '$lib/stores/theme.svelte';
	import { page } from '$app/state';

	let { children, data } = $props();
	let { session, supabase } = data;

	$effect(() => {
		initializeTheme();
	});

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});

	const isHeaderHidden = page.route.id === '/quick-add';
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<link rel="manifest" href="/manifest.json" />

	<!-- Additional meta tags for better PWA support -->
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Breader" />
	<link rel="apple-touch-icon" href="/icons/icon-192.png" />
</svelte:head>

<svelte:window onbeforeinstallprompt={handleBeforeInstallPrompt} />

<!-- Skip navigation for accessibility -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary"
>
	Skip to main content
</a>

{#if !isHeaderHidden}
	<header>
		<Logo class="col-2"></Logo>
		<MainMenu class="col-3 justify-self-end"></MainMenu>
	</header>
{/if}

{@render children?.()}

<footer></footer>

{#await import('$lib/components/ReloadPrompt.svelte') then { default: ReloadPrompt }}
	<ReloadPrompt />
{/await}
