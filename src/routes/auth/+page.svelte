<!-- ABOUTME: Magic link authentication page with email form and server actions -->
<!-- ABOUTME: Handles login/signup flow with enhanced form validation and user feedback -->

<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { form } = $props();

	let loading = $state(false);

	const handleSubmit: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			update();
			loading = false;
		};
	};
</script>

<svelte:head>
	<title>Login - Breader</title>
</svelte:head>

<main
	id="main-content"
	class="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center"
>
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold tracking-tight">Welcome to Breader</h1>
			<p class="mt-2 text-sm text-base-content/70">Sign in via magic link with your email below</p>
		</div>

		<form class="mt-8 space-y-6" method="POST" use:enhance={handleSubmit}>
			{#if form?.message}
				<div class="alert {form?.success ? 'alert-success' : 'alert-error'}">
					{form.message}
				</div>
			{/if}

			<div class="form-control">
				<label for="email" class="label">
					<span class="label-text">Email address</span>
				</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					class="input input-bordered w-full"
					class:input-error={form?.errors?.email}
					placeholder="your@email.com"
					value={form?.email ?? ''}
				/>
				{#if form?.errors?.email}
					<div class="label">
						<span class="label-text-alt text-error">{form.errors.email}</span>
					</div>
				{/if}
			</div>

			<div>
				<button type="submit" disabled={loading} class="btn btn-primary w-full" class:loading>
					{loading ? 'Sending...' : 'Send magic link'}
				</button>
			</div>
		</form>

		<div class="text-center text-sm text-base-content/60">
			<p>No account needed! We'll create one for you automatically.</p>
		</div>
	</div>
</main>
