<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';

	let { data } = $props();
	let session = $derived(data.session);

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
	Logged in as <b>{session.user.email}</b>
</p>

<div class="flex gap-2">
	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<button type="submit" disabled={loading} class="btn btn-secondary"> Sign Out </button>
	</form>
</div>

<div class="mt-8">
	<a class="link link-accent text-sm" href={resolve('/')}>&larr; Back to your bookmarks</a>
</div>
