<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';

	let { data } = $props();
	let { session } = data;

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

<div class="mt-4">
	<a class="link link-accent text-sm" href={resolve('/')}>&larr; Back to your bookmarks</a>
</div>
