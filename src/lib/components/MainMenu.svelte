<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { installPWA, canInstall } from '$lib/stores/installPWA.svelte.js';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';

	let props = $props();
	let session = $derived(page.data.session);
	let themeDialog = $state() as HTMLDialogElement;
	let menuDropdown = $state() as HTMLDetailsElement;

	// Close dropdown after navigation
	afterNavigate(() => {
		menuDropdown.removeAttribute('open');
	});

	// Close dropdown when clicking outside
	$effect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuDropdown && !menuDropdown.contains(event.target as Node)) {
				menuDropdown.removeAttribute('open');
			}
		};

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});
</script>

<nav aria-label="Main navigation" class={props.class}>
	<details bind:this={menuDropdown} class="dropdown dropdown-end">
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
				<button
					class="flex justify-between"
					onclick={() => {
						menuDropdown.removeAttribute('open');
						themeDialog.showModal();
					}}>Change Theme <span class="icon-[ri--sparkling-2-fill]"></span></button
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
				<button class="btn">Close</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<!-- responsible for closing when clicked outside -->
		<button>close</button>
	</form>
</dialog>
