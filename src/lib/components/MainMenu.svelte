<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { installPWA, canInstall } from '$lib/stores/installPWA.svelte.js';

	let session = $derived($page.data.session);

	// Close dropdown after navigation
	afterNavigate(() => {
		const openDetails = document.querySelectorAll('details[open]');
		openDetails.forEach((details) => details.removeAttribute('open'));
	});
</script>

<nav aria-label="Main navigation">
	<details class="dropdown dropdown-end">
		<summary class="btn btn-ghost btn-square">
			<span class="icon-[hugeicons--menu-11]"></span>
		</summary>
		<ul class="menu dropdown-content rounded-box bg-base-100 z-1 w-52 shadow p-2 space-y-1">
			{#if !session}
				<li>
					<a href="/auth" class="flex justify-between"
						>Login <span class="icon-[ri--login-box-line]"></span></a
					>
				</li>
			{:else}
				<li>
					<a href="/account" class="flex justify-between"
						>Account <span class="icon-[ri--user-settings-line]"></span></a
					>
				</li>
			{/if}
			{#if $canInstall}
				<li>
					<button class="btn btn-primary btn-sm" onclick={installPWA}>
						<span class="icon-[hugeicons--download-01]"></span>
						Install App
					</button>
				</li>
			{/if}
		</ul>
	</details>
</nav>
