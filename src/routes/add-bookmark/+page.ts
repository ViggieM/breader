import type { Bookmark } from '$lib/types/bookmark';
import type { PageLoad } from './$types';

// Disable SSR to ensure this page works offline via client-side rendering
export const ssr = false;

export const load: PageLoad = ({ url }) => {
	const urlParams = url.searchParams;

	const articleData: Partial<Bookmark> = {
		title: urlParams.get('title') || '',
		url: urlParams.get('url') || urlParams.get('text') || '',
		description: urlParams.get('text') || ''
	};

	return {
		articleData
	};
};
