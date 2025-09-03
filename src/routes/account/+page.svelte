<script lang="ts">
	import { browser } from '$app/environment';
	import { getTheme, themes } from '$lib/stores/theme.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import TagManager from '$lib/components/TagManager.svelte';

	let { data } = $props();
	let { session } = data;

	const theme = getTheme();
	let loading = $state(false);

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	};
</script>

<h2>Account Details</h2>

<p class="my-2">
	Email: {session.user.email}
</p>

<div class="flex gap-2">
	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<button type="submit" disabled={loading} class="btn btn-secondary"> Sign Out </button>
	</form>
</div>

<h2 class="mt-8">Settings</h2>

<h3 class="mt-4">Manage Tags</h3>

<div class="mt-2">
	<TagManager />
</div>

<h3 class="mt-4">Theme</h3>

<div class="mt-2">
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
