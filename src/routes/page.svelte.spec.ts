import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render main content', async () => {
		render(Page);

		const main = page.getByRole('main');
		await expect.element(main).toBeInTheDocument();
	});
});
