<script lang="ts">
import '../styles/app.css';

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
  <title>Breader</title>
  <link rel="manifest" href="/manifest.json">

  <!-- Additional meta tags for better PWA support -->
  <meta name="theme-color" content="var(--color-secondary)">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Breader">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
</svelte:head>

<header>
  <a href="/">
    <img src="/icons/icon-48.png" alt="logo" class="size-8"/>
    <img src="/logo.svg" alt="Breader" class="h-4"/>
  </a>
</header>
<main>
  {@render children?.()}
</main>
<footer></footer>
