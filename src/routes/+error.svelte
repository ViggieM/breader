<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import svg404 from '$lib/assets/404.svg?raw';
	import svg500 from '$lib/assets/500.svg?raw';

	// Get error details
	const status = $derived(page.status);
	const message = $derived(page.error?.message || 'Something went wrong');

	// Error-specific content
	const is404 = $derived(status === 404);
	const is500 = $derived(status >= 500);

	// Dynamic content based on error type
	const title = $derived(is404 ? 'Page Not Found' : is500 ? 'Server Error' : `Error ${status}`);

	const description = $derived(
		is404
			? 'This page is like a bookmark to nowhere – it seems to have gotten lost in the digital library!'
			: is500
				? 'Our servers are having trouble processing your request. Please try again later.'
				: message
	);

	// Capture console logs and errors
	let consoleLogs = $state<Array<{ type: string; message: string; timestamp: Date }>>([]);

	if (browser) {
		// Store original console methods
		const originalLog = console.log;
		const originalError = console.error;
		const originalWarn = console.warn;

		// Override console methods to capture logs
		console.log = (...args) => {
			consoleLogs.push({
				type: 'log',
				message: args
					.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
					.join(' '),
				timestamp: new Date()
			});
			originalLog.apply(console, args);
		};

		console.error = (...args) => {
			consoleLogs.push({
				type: 'error',
				message: args
					.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
					.join(' '),
				timestamp: new Date()
			});
			originalError.apply(console, args);
		};

		console.warn = (...args) => {
			consoleLogs.push({
				type: 'warn',
				message: args
					.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
					.join(' '),
				timestamp: new Date()
			});
			originalWarn.apply(console, args);
		};

		// Listen for global JavaScript errors
		window.addEventListener('error', (event) => {
			let errorMessage = '';

			if (event.error) {
				errorMessage = `${event.error.name || 'Error'}: ${event.error.message}`;
				if (event.error.stack) {
					errorMessage += `\n\nStack trace:\n${event.error.stack}`;
				}
				if (event.filename) {
					errorMessage += `\n\nLocation: ${event.filename}:${event.lineno}:${event.colno}`;
				}
			} else {
				errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
			}

			consoleLogs.push({
				type: 'error',
				message: errorMessage,
				timestamp: new Date()
			});
		});

		// Listen for unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			let errorMessage = 'Unhandled Promise Rejection: ';

			if (event.reason && typeof event.reason === 'object') {
				if (event.reason.message) {
					errorMessage += event.reason.message;
				} else {
					errorMessage += JSON.stringify(event.reason, null, 2);
				}

				if (event.reason.stack) {
					errorMessage += `\n\nStack trace:\n${event.reason.stack}`;
				}
			} else {
				errorMessage += String(event.reason);
			}

			consoleLogs.push({
				type: 'error',
				message: errorMessage,
				timestamp: new Date()
			});
		});

		// Intercept WebSocket constructor to track WebSocket connections
		const OriginalWebSocket = window.WebSocket;
		window.WebSocket = class extends OriginalWebSocket {
			constructor(url: string | URL, protocols?: string | string[]) {
				super(url, protocols);

				consoleLogs.push({
					type: 'log',
					message: `WebSocket connecting to: ${url}${protocols ? ` (protocols: ${JSON.stringify(protocols)})` : ''}`,
					timestamp: new Date()
				});

				this.addEventListener('open', () => {
					consoleLogs.push({
						type: 'log',
						message: `WebSocket connected successfully to: ${url}`,
						timestamp: new Date()
					});
				});

				this.addEventListener('close', (event) => {
					consoleLogs.push({
						type: 'warn',
						message: `WebSocket closed: ${url}\nCode: ${event.code}\nReason: ${event.reason || 'No reason provided'}\nWas Clean: ${event.wasClean}`,
						timestamp: new Date()
					});
				});

				this.addEventListener('error', (event) => {
					const ws = event.target as WebSocket | null;
					consoleLogs.push({
						type: 'error',
						message: `WebSocket error for: ${url}\nEvent: ${JSON.stringify(
							{
								type: event.type,
								target: ws
									? {
											readyState: ws.readyState,
											url: ws.url
										}
									: 'Unknown target'
							},
							null,
							2
						)}`,
						timestamp: new Date()
					});
				});
			}
		};
	}
</script>

<svelte:head>
	<title>{title} - Breader</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!--<div class="flex flex-col">-->

<!-- Main error content -->
<main id="main-content" class="flex-1 flex items-center justify-center p-4">
	<div class="text-center max-w-2xl mx-auto space-y-8">
		<!-- Error illustration -->
		<div class="flex flex-col items-center justify-start gap-6">
			<img src="/icons/icon-192.png" alt="" class="size-32" role="presentation" />
			{#if is404}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<div class="w-72">{@html svg404}</div>
			{:else}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				<div class="w-72">{@html svg500}</div>
			{/if}

			<h1 class="sr-only">
				{status}
			</h1>
			<h2 class="text-2xl sm:text-3xl font-semibold">
				{title}
			</h2>
		</div>

		<!-- Description -->
		<p class="text-lg text-base-content/80 leading-relaxed">
			{description}
		</p>

		<!-- Action buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<a href="/" class="btn btn-primary btn-lg">
				<span class="icon-[material-symbols--home]"></span>
				Go Home
			</a>
		</div>

		<!-- Debug info for development -->
		{#if is500}
			<details class="collapse collapse-arrow bg-base-200">
				<summary class="collapse-title text-sm font-medium"> Technical Details </summary>
				<div class="collapse-content text-xs text-left">
					<pre class="bg-base-300 p-3 rounded text-xs overflow-auto">{JSON.stringify(
							{
								status,
								message,
								url: page.url.pathname
							},
							null,
							2
						)}</pre>
				</div>
			</details>

			<!-- Console logs section -->
			{#if consoleLogs.length > 0}
				<details class="collapse collapse-arrow bg-base-200">
					<summary class="collapse-title text-sm font-medium">
						Console Logs ({consoleLogs.length})
					</summary>
					<div class="collapse-content text-xs text-left space-y-2 max-h-96 overflow-auto">
						{#each consoleLogs.slice(-20) as log}
							<div
								class="p-2 rounded border-l-4 {log.type === 'error'
									? 'border-error bg-error/10'
									: log.type === 'warn'
										? 'border-warning bg-warning/10'
										: 'border-info bg-info/10'}"
							>
								<div class="flex justify-between items-start gap-2 mb-1">
									<span
										class="text-xs font-mono px-2 py-1 rounded {log.type === 'error'
											? 'bg-error text-error-content'
											: log.type === 'warn'
												? 'bg-warning text-warning-content'
												: 'bg-info text-info-content'}"
									>
										{log.type.toUpperCase()}
									</span>
									<span class="text-xs opacity-60">
										{log.timestamp.toLocaleTimeString()}
									</span>
								</div>
								<pre class="whitespace-pre-wrap text-xs font-mono">{log.message}</pre>
							</div>
						{/each}
					</div>
				</details>
			{/if}
		{/if}
	</div>
</main>

<!-- Footer spacer -->
<footer class="p-4 text-center text-xs text-base-content/50">
	<p>Lost your way? That's okay – even the best readers sometimes close the wrong book.</p>
</footer>
<!--</div>-->
