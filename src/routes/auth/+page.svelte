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

<main id="main-content" class="hero bg-base-200 min-h-screen">
	<div class="hero-content flex-col">
		<div class="text-center mb-8">
			<img
				src="/icons/icon-512.png"
				alt="Breader"
				class="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg"
			/>
			<h1 class="text-4xl font-bold">Welcome to Breader</h1>
			<p class="mt-4 text-lg text-base-content/70">Sign in via magic link with your email below</p>
		</div>

		<div class="card bg-base-100 w-full max-w-md shadow-2xl">
			<div class="card-body">
				{#if form?.message}
					<div class="alert {form?.success ? 'alert-success' : 'alert-error'} mb-4">
						{form.message}
					</div>
				{/if}

				<form method="POST" use:enhance={handleSubmit}>
					<fieldset class="fieldset">
						<label class="label">
							<span class="label-text font-medium">Email address</span>
						</label>
						<label
							class="input input-bordered validator {form?.errors?.email ? 'input-error' : ''}"
						>
							<svg
								class="h-[1em] opacity-50"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
							>
								<g
									stroke-linejoin="round"
									stroke-linecap="round"
									stroke-width="2.5"
									fill="none"
									stroke="currentColor"
								>
									<rect width="20" height="16" x="2" y="4" rx="2"></rect>
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
								</g>
							</svg>
							<input
								id="email"
								name="email"
								type="email"
								required
								placeholder="your@email.com"
								value={form?.email ?? ''}
							/>
						</label>
						{#if form?.errors?.email}
							<div class="validator-hint text-error mt-1">
								{form.errors.email}
							</div>
						{/if}

						<button
							type="submit"
							disabled={loading}
							class="btn btn-primary btn-block mt-6"
							class:loading
						>
							{#if loading}
								<span class="loading loading-spinner loading-sm"></span>
								Sending...
							{:else}
								Send magic link
							{/if}
						</button>
					</fieldset>
				</form>

				<div class="divider text-xs">No account needed</div>
				<p class="text-center text-sm text-base-content/60">
					We'll create one for you automatically
				</p>
			</div>
		</div>
	</div>
</main>
