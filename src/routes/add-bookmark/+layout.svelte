<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Add Bookmark | Breader</title>
</svelte:head>

<main class="add">
	{@render children?.()}
</main>
