<script lang="ts">
	let { children } = $props();
</script>

<main class="prose pt-12">
	{@render children?.()}
</main>
