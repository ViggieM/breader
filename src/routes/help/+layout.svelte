<script lang="ts">
	let { children } = $props();
</script>

<main class="prose pt-12 mb-24">
	{@render children?.()}
</main>
