// ABOUTME: Component tests for YouTubeEmbed component
// ABOUTME: Tests iframe rendering and basic component structure

import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import YouTubeEmbed from './YouTubeEmbed.svelte';

describe('YouTubeEmbed', () => {
	it('should render iframe element', async () => {
		render(YouTubeEmbed, { videoId: 'dQw4w9WgXcQ' });

		const iframe = page.getByTitle('YouTube video');
		await expect.element(iframe).toBeInTheDocument();
	});
});
