<script lang="ts">
	import { browser } from '$app/environment';
	import { getTheme, themes } from '$lib/stores/theme.svelte';

	const theme = getTheme();
</script>

<h1>Settings</h1>

<h2>Theme</h2>

<div>
	<fieldset class="fieldset">
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
			{#each themes as option (option.value)}
				<label
					class="flex gap-2 cursor-pointer items-center p-2 rounded border border-base-300 hover:bg-base-200 transition-colors"
				>
					<input
						type="radio"
						name="theme-radios"
						class="radio radio-sm theme-controller"
						value={option.value}
						checked={browser ? theme.current === option.value : false}
						onchange={() => theme.set(option.value)}
					/>
					<span class="text-sm font-medium">{option.label}</span>
				</label>
			{/each}
		</div>
	</fieldset>
</div>
<div class="mt-4">
	<a class="link link-accent text-sm" href="/">&larr; Back to your bookmarks</a>
</div>
