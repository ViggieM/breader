import { browser } from '$app/environment';

export const themes = [
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'retro', label: 'Retro' },
	{ value: 'cyberpunk', label: 'Cyberpunk' },
	{ value: 'valentine', label: 'Valentine' },
	{ value: 'aqua', label: 'Aqua' }
];

let theme = $state(browser ? localStorage.getItem('theme') || 'light' : 'light');

export function getTheme() {
	return {
		get current() {
			return theme;
		},
		set(newTheme: string) {
			theme = newTheme;
			if (browser) {
				localStorage.setItem('theme', newTheme);
			}
		},
		toggle() {
			this.set(theme === 'light' ? 'dark' : 'light');
		}
	};
}
