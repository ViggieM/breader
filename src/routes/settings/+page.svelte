<script lang="ts">
	import { browser } from '$app/environment';
	import { getTheme, themes } from '$lib/stores/theme.svelte';

	const theme = getTheme();
</script>

<h1>Settings</h1>

<h2>Theme</h2>

<div>
	<fieldset class="fieldset">
		{#each themes as option (option.value)}
			<label class="flex gap-2 cursor-pointer items-center">
				<input
					type="radio"
					name="theme-radios"
					class="radio radio-sm theme-controller"
					value={option.value}
					checked={browser ? theme.current === option.value : false}
					onchange={() => theme.set(option.value)}
				/>
				{option.label}
			</label>
		{/each}
	</fieldset>
</div>
<div class="mt-4">
	<a class="link link-accent text-sm" href="/">&larr; Back to your bookmarks</a>
</div>
