<!-- ABOUTME: Help index page that provides navigation to all help resources and documentation -->
<!-- ABOUTME: Includes welcome section, help topic cards, keyboard shortcuts, and contact information -->
<script lang="ts">
	import { resolve } from '$app/paths';

	const helpSections = [
		{
			title: 'What is Breader?',
			description:
				"Learn about Breader's philosophy, key features, and how it helps you organize your reading list.",
			href: '/help/what-is-breader',
			icon: 'icon-[ri--information-line]'
		},
		{
			title: 'How to Use',
			description:
				'Get started with the browser extension, organize bookmarks with tags, and master search features.',
			href: '/help/how-to-use',
			icon: 'icon-[ri--book-open-line]'
		},
		{
			title: 'Import Bookmarks',
			description: 'Move your existing bookmarks from Chrome, Firefox, or Safari into Breader.',
			href: '/help/import-bookmarks',
			icon: 'icon-[ri--download-line]'
		},
		{
			title: 'Privacy Policy',
			description: 'Understand how we protect your data and comply with GDPR regulations.',
			href: '/help/privacy',
			icon: 'icon-[ri--shield-check-line]'
		}
	] as const;

	const shortcuts = [
		{ keys: ['Ctrl', 'K'], description: 'Focus search bar' },
		{ keys: ['Ctrl', '.'], description: 'Save bookmark (with extension)' }
	];
</script>

<svelte:head>
	<title>Help - Breader</title>
</svelte:head>

<h1>Welcome to Breader Help</h1>
<p>
	Find answers to common questions, learn how to use Breader, and get the most out of your
	bookmarking experience.
</p>

<h2 class="mt-8">Getting Started</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
	{#each helpSections as section, idx (idx)}
		<a
			href={resolve(section.href)}
			class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow block focus-visible:ring-2 focus-visible:ring-primary"
		>
			<div class="card-body">
				<div class="flex items-start gap-4">
					<div class="text-primary">
						<span class={`${section.icon} size-8`}></span>
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold mb-2">{section.title}</h3>
						<p class="text-sm text-base-content/70">
							{section.description}
						</p>
					</div>
				</div>
			</div>
		</a>
	{/each}
</div>

<h2 class="mt-12">Keyboard Shortcuts</h2>
<div class="not-prose">
	<ul class="space-y-2">
		{#each shortcuts as shortcut, idx (idx)}
			<li class="flex items-center gap-3">
				<span class="flex gap-1 items-center">
					{#each shortcut.keys as key, idx (idx)}
						<kbd class="kbd">{key}</kbd>
						{#if shortcut.keys.indexOf(key) < shortcut.keys.length - 1}
							<span>+</span>
						{/if}
					{/each}
				</span>
				<span class="text-base-content/70">{shortcut.description}</span>
			</li>
		{/each}
	</ul>
</div>

<h2 class="mt-12">Need More Help?</h2>
<p>
	If you have questions, feedback, or need assistance, feel free to reach out to us at
	<a href="mailto:hello@breader.app" class="link">hello@breader.app</a>.
</p>
