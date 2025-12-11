import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig(({ command }) => ({
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		SvelteKitPWA({
			registerType: 'prompt',
			strategies: 'injectManifest',
			// If you're not using precaching (self.__WB_MANIFEST), you need to disable injection point to avoid compilation errors
			// https://vite-pwa-org.netlify.app/guide/inject-manifest.html#service-worker-code
			// injectManifest: {
			//   injectionPoint: undefined,
			// },
			srcDir: 'src',
			filename: command === 'serve' ? 'service-worker/index.ts' : 'service-worker.js',

			// To enable the service worker on development, you only need to add the following options to the plugin configuration:
			// https://vite-pwa-org.netlify.app/guide/development.html#plugin-configuration
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
	server: {
		watch: {
			ignored: ['**/.trees/**']
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
}));
