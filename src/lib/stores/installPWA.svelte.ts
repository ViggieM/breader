import { writable } from 'svelte/store';

export const canInstall = writable(false);
let deferredPrompt: BeforeInstallPromptEvent | null = $state(null);

interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function handleBeforeInstallPrompt(e: Event) {
	e.preventDefault();
	deferredPrompt = e as BeforeInstallPromptEvent;
	canInstall.set(true);
}

export async function installPWA() {
	if (deferredPrompt) {
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
			canInstall.set(false);
		}
	}
}
