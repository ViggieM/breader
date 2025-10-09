<script lang="ts">
	import { getTheme, setTheme, themes, type Theme } from '$lib/stores/theme.svelte';

	let currentTheme = $derived(getTheme());

	function handleThemeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newTheme = target.value as Theme;
		setTheme(newTheme);
	}
</script>

<div class="form-control">
	<select class="select-bordered select w-full" value={currentTheme} onchange={handleThemeChange}>
		{#each themes as theme (theme)}
			<option value={theme}>
				{theme.charAt(0).toUpperCase() + theme.slice(1)}
			</option>
		{/each}
	</select>
</div>
