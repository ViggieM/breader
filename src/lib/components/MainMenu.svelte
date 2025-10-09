<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { installPWA, canInstall } from '$lib/stores/installPWA.svelte.js';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';

	let props = $props();
	let session = $derived(page.data.session);
	let themeDialog = $state() as HTMLDialogElement;

	// Close dropdown after navigation
	afterNavigate(() => {
		const openDetails = document.querySelectorAll('details[open]');
		openDetails.forEach((details) => details.removeAttribute('open'));
	});
</script>

<nav aria-label="Main navigation" class={props.class}>
	<details class="dropdown dropdown-end">
		<summary class="btn btn-ghost btn-square">
			<span class="icon-[hugeicons--menu-11]"></span>
		</summary>
		<ul class="menu dropdown-content rounded-box bg-base-100 z-1 w-52 shadow p-2 space-y-1">
			<li>
				<a href="/tags" class="flex justify-between"
					>Manage Tags <span class="icon-[ri--price-tag-3-fill]"></span></a
				>
			</li>
			<li>
				<button class="flex justify-between" onclick={() => themeDialog.showModal()}
					>Change Theme <span class="icon-[ri--sparkling-2-fill]"></span></button
				>
			</li>
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

<dialog bind:this={themeDialog} class="modal modal-bottom sm:modal-middle">
	<div class="modal-box">
		<h3 class="text-lg font-bold mb-4">Select a theme</h3>
		<ThemeSelector />
		<div class="modal-action">
			<form method="dialog">
				<!-- if there is a button in form, it will close the modal -->
				<button class="btn">Close</button>
			</form>
		</div>
	</div>
</dialog>
