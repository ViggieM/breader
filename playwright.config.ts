import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'pnpm preview',
		port: 8787,
		timeout: 120000
	},
	testDir: 'e2e'
});
