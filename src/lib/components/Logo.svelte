<script lang="ts">
	import Logo from '$lib/assets/logo.svg?raw';
	import { resolve } from '$app/paths';
	let props = $props();
</script>

<div class={`inline-flex relative items-center justify-center gap-4 cursor-pointer ${props.class}`}>
	<a href={resolve('/')} class="text-transparent absolute inset-0 z-10" title="Breader home"
		>Breader home</a
	>
	<img src="/icons/icon-48.png" alt="" class="size-8" role="presentation" />
	<div class="h-6 w-auto [&>svg]:h-full [&>svg]:w-auto">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html Logo}
	</div>
</div>
