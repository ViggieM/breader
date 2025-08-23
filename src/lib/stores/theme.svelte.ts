import { browser } from '$app/environment';

export const themes = [
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'cupcake', label: 'Cupcake' },
	{ value: 'bumblebee', label: 'Bumblebee' },
	{ value: 'emerald', label: 'Emerald' },
	{ value: 'corporate', label: 'Corporate' },
	{ value: 'synthwave', label: 'Synthwave' },
	{ value: 'retro', label: 'Retro' },
	{ value: 'cyberpunk', label: 'Cyberpunk' },
	{ value: 'valentine', label: 'Valentine' },
	{ value: 'halloween', label: 'Halloween' },
	{ value: 'garden', label: 'Garden' },
	{ value: 'forest', label: 'Forest' },
	{ value: 'aqua', label: 'Aqua' },
	{ value: 'lofi', label: 'LoFi' },
	{ value: 'pastel', label: 'Pastel' },
	{ value: 'fantasy', label: 'Fantasy' },
	{ value: 'wireframe', label: 'Wireframe' },
	{ value: 'black', label: 'Black' },
	{ value: 'luxury', label: 'Luxury' },
	{ value: 'dracula', label: 'Dracula' },
	{ value: 'cmyk', label: 'CMYK' },
	{ value: 'autumn', label: 'Autumn' },
	{ value: 'business', label: 'Business' },
	{ value: 'acid', label: 'Acid' },
	{ value: 'lemonade', label: 'Lemonade' },
	{ value: 'night', label: 'Night' },
	{ value: 'coffee', label: 'Coffee' },
	{ value: 'winter', label: 'Winter' },
	{ value: 'dim', label: 'Dim' },
	{ value: 'nord', label: 'Nord' },
	{ value: 'sunset', label: 'Sunset' },
	{ value: 'abyss', label: 'Abyss' },
	{ value: 'silk', label: 'Silk' }
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
