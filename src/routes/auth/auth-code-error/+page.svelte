<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Authentication Error - Breader</title>
</svelte:head>

<main
	id="main-content"
	class="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center"
>
	<div class="w-full max-w-md space-y-8 text-center">
		<div class="space-y-4">
			<div class="text-6xl">❌</div>
			<h1 class="text-3xl font-bold tracking-tight">Authentication Error</h1>
			<p class="text-base-content/70">
				There was a problem with your authentication. This can happen if:
			</p>
			<ul class="text-left space-y-1 text-sm text-base-content/60">
				<li>• The magic link has expired</li>
				<li>• The magic link has already been used</li>
				<li>• There was a temporary server issue</li>
			</ul>
		</div>

		<div class="space-y-4">
			<a href={resolve('/auth')} class="btn btn-primary w-full"> Try signing in again </a>
			<a href={resolve('/')} class="btn btn-ghost w-full"> Go back home </a>
		</div>
	</div>
</main>
