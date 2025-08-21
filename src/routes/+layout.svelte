<script lang="ts">
import '../styles/app.css';
import { browser } from '$app/environment';
import { closeDetailsOnOutsideClick } from '$lib';
import Logo from '$lib/assets/logo.svg?raw';
import MainMenu from '$lib/components/MainMenu.svelte';
import { handleBeforeInstallPrompt } from '$lib/stores/installPWA.svelte.js';
import { getTheme } from '$lib/stores/theme.svelte';

let { children } = $props();
const theme = getTheme();

$effect(() => {
  if (browser) {
    document.documentElement.setAttribute('data-theme', theme.current);
  }
});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
  <title>Breader</title>
  <link rel="manifest" href="/manifest.json">

  <!-- Additional meta tags for better PWA support -->
  <meta name="theme-color" content="var(--color-secondary)">
  <!-- todo: what is the theme color? -->
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Breader">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
</svelte:head>

<svelte:window
  onclick={closeDetailsOnOutsideClick}
  onbeforeinstallprompt={handleBeforeInstallPrompt}
/>

<header>
  <div>
    <a href="/" class="text-transparent" title="Breader home">Breader home</a>
    <img src="/icons/icon-48.png" alt="" class="size-8" role="presentation"/>
    <div class="h-6 w-auto [&>svg]:h-full [&>svg]:w-auto">
      {@html Logo}
    </div>
  </div>
  <MainMenu></MainMenu>
</header>

{@render children?.()}

<footer>

</footer>
