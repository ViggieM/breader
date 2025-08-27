<script lang="ts">
	import { browser } from '$app/environment';
	import { getTheme, themes } from '$lib/stores/theme.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import { db } from '$lib/db/index.js';
	import { exportDB, importDB } from 'dexie-export-import';

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

	async function handleExport() {
		const blob = await exportDB(db);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `breader-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function handleImport() {
		const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = fileInput.files?.[0];

		if (!file) {
			console.error('No file selected');
			return;
		}

		try {
			console.log('Importing ' + file.name);
			await db.delete({ disableAutoOpen: false });
			await importDB(file);
			await db.cloud.sync();
			console.log('Import complete');
			fileInput.value = '';
		} catch (error) {
			console.error('' + error);
		}
	}
</script>

<h2>Account Details</h2>

<p class="my-2">
	Email: {session.user.email}
</p>

<div class="flex gap-2">
	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<button type="submit" disabled={loading} class="btn btn-secondary"> Sign Out </button>
	</form>

	<button
		type="button"
		disabled={loading}
		class="btn btn-secondary btn-outline"
		onclick={handleExport}
	>
		Export DB
	</button>
</div>

<form action="" class="flex gap-2 items-baseline">
	<fieldset class="fieldset">
		<legend class="fieldset-legend">Import from JSON</legend>
		<input type="file" class="file-input" accept=".json" />
	</fieldset>
	<button type="button" class="btn" onclick={handleImport}>Import</button>
</form>

<h2>Settings</h2>

<h3>Theme</h3>

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
