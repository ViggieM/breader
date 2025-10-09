<script lang="ts">
	import '../styles/app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import Logo from '$lib/components/Logo.svelte';
	import MainMenu from '$lib/components/MainMenu.svelte';
	import { handleBeforeInstallPrompt } from '$lib/stores/installPWA.svelte.js';
	import { initializeTheme } from '$lib/stores/theme.svelte';

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

		// Service worker error handling
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.ready
				.then((registration) => {
					console.log('Service worker registered successfully:', registration);

					// Listen for service worker updates
					registration.addEventListener('updatefound', () => {
						const newWorker = registration.installing;
						if (newWorker) {
							newWorker.addEventListener('statechange', () => {
								if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
									console.log('New service worker available');
								}
							});
						}
					});
				})
				.catch((error) => {
					console.warn('Service worker registration failed:', error);
				});

			// Handle service worker errors
			navigator.serviceWorker.addEventListener('error', (error) => {
				console.error('Service worker error:', error);
			});

			// Handle service worker messages
			navigator.serviceWorker.addEventListener('message', (event) => {
				if (event.data && event.data.type === 'CACHE_ERROR') {
					console.warn('Service worker cache error:', event.data.message);
				}
			});
		}

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

<svelte:window onbeforeinstallprompt={handleBeforeInstallPrompt} />

<!-- Skip navigation for accessibility -->
<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn btn-primary"
>
	Skip to main content
</a>

<header>
	<Logo class="col-2"></Logo>
	<MainMenu class="col-3 justify-self-end"></MainMenu>
</header>

{@render children?.()}

<footer></footer>
