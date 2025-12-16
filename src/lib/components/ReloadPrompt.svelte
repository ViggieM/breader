<!-- ABOUTME: PWA reload prompt component that notifies users when the app is ready offline or when new content is available -->
<!-- ABOUTME: Uses virtual:pwa-register/svelte to handle service worker registration and updates -->
<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { dev } from '$app/environment';

	const intervalMS = 60 * 60 * 1000;
	const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW({
		onRegisteredSW(swScriptUrl: string, registration: ServiceWorkerRegistration | undefined) {
			console.log(`SW Registered: ${registration}`);

			/* Periodically check for updates (disabled in dev to avoid update conflicts) */
			if (registration && !dev) {
				setInterval(() => {
					console.log('SW Checking for updates');
					registration.update();
				}, intervalMS);
			}
		},
		onRegisterError(error: Error) {
			console.log('SW registration error', error);
		},
		onNeedRefresh() {
			console.log(`SW needs refresh`);
		},
		onOfflineReady() {
			console.log(`SW was installed and is now ready to serve offline requests`);
		}
	});

	const close = () => {
		offlineReady.set(false);
		needRefresh.set(false);
	};

	// Derived state using $derived rune
	const toast = $derived($offlineReady || $needRefresh);
</script>

{#if toast}
	<div class="toast">
		<div class="alert alert-warning">
			<div>
				{#if $offlineReady}
					<span>App ready to work offline</span>
				{:else}
					<span>New content available, click on reload button to update.</span>
				{/if}
				<div class="mt-2 text-right">
					<button
						class="btn btn-sm btn-warning"
						onclick={() => {
							updateServiceWorker(true);
						}}
					>
						Reload
					</button>
					<button class="btn btn-sm btn-warning" onclick={close}> Close </button>
				</div>
			</div>
		</div>
	</div>
{/if}
