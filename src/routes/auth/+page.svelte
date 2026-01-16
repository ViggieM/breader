<!-- ABOUTME: Magic link authentication page with email form and server actions -->
<!-- ABOUTME: Handles login/signup flow with enhanced form validation and user feedback -->

<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
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

<main id="auth" class="hero">
	<div class="hero-content flex-col">
		<div class="text-center mb-8">
			<img
				src="/icons/icon-192.png"
				alt="Breader"
				class="w-24 h-24 mx-auto mb-6 rounded-3xl shadow-lg"
			/>
			<h1 class="text-2xl md:text-4xl font-bold">Welcome to Breader</h1>
			<p class="mt-4 text-base md:text-lg text-base-content/70">
				Sign in via magic link with your email below
			</p>
		</div>

		<div class="card bg-base-100 w-full md:w-md shadow-2xl mb-8">
			<div class="card-body">
				{#if form?.message}
					<div class="alert {form?.success ? 'alert-success' : 'alert-error'} mb-4">
						{form.message}
					</div>
				{/if}

				<form method="POST" use:enhance={handleSubmit} novalidate>
					<fieldset class="fieldset">
						<label class="input validator w-full {form?.errors?.email ? 'input-error' : ''}">
							<span class="icon-[ri--mail-line] h-[1em] opacity-50"></span>
							<input
								id="email"
								autocomplete="email"
								name="email"
								type="email"
								required
								class="w-full"
								placeholder="your@email.com"
								value={form?.email ?? ''}
							/>
						</label>
						{#if form?.errors?.email}
							<div class="text-error">
								{form.errors.email}
							</div>
						{/if}

						<button type="submit" disabled={loading} class="btn btn-primary btn-block mt-6">
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

				<div class="mt-4 text-xs text-base-content/50 space-y-1">
					<p>
						Your bookmarks are synced securely via <a
							href="https://dexie.org/"
							class="link link-primary">Dexie Cloud</a
						>, enabling access across all your devices.
					</p>
					<p>
						See our <a href={resolve('/help/privacy')} class="link link-primary">Privacy Policy</a> for
						details on how your data is handled.
					</p>
				</div>
			</div>
		</div>
	</div>
</main>
