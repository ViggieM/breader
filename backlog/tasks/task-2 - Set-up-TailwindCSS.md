---
id: task-2
title: Set up TailwindCSS
status: Done
assignee: []
created_date: '2025-08-14'
updated_date: '2025-08-30 18:00'
labels: []
dependencies: []
---

## Description

# Instructions

- create a folder `src/styles` and move `app.css` there. Make sure to update the import in @src/routes/+layout.svelte
- create the files `theme.css`, `base.css`, `utilities.css` and `components/index.css`. The following sections describe their contents in detail

## `app.css`

The contents of the file should look like this:

```css
@import 'tailwindcss';

@import './theme.css' layer(theme);
@import './base.css' layer(base);
@import './components' layer(components);
@import './utilities.css' layer(utilities);

/* Custom variants */
@custom-variant dark (&:where(.dark, .dark *));

/* Plugins */
@plugin "@tailwindcss/forms";
```

## `theme.css`

The contents of the file should look like this:

```css
:root {
	--foreground: black;
	--background: rgb(255, 243, 220);
	--primary: rgb(16, 44, 87);
	--secondary: rgb(218, 192, 163);
}

@theme {
	--color-primary: var(--primary);
	--color-secondary: var(--secondary);
	--color-foreground: var(--foreground);
	--color-background: var(--background);
}
```

Note: Theme colors are derived from https://colorhunt.co/palette/fefaf6eadbc8dac0a3102c57

## `base.css`

```css
html {
	@apply scroll-smooth;

	::selection {
		background: var(--secondary);
	}
}

body {
	@apply bg-background text-foreground font-sans;
	grid-template-rows: auto 1fr auto;
	min-height: 100vh;
}

/*header {}*/

/*footer {}*/

a {
	@apply text-primary/80 hover:text-primary truncate;
}
```

## `utilities.css`

Leave empty for now

## `components/index.css`

Leave empty for now

## Add TailwindCSS Icon plugin from iconify

Install with

```bash
pnpm i -D @iconify/tailwind4
```

Add all open source icon sets

```bash
pnpm i -D @iconify/json
```

Add the plugin to `app.css`

```css
@plugin "@iconify/tailwind4";
```

# Cleanup

Add all changes to git and commit with the message "Set up TailwindCSS"
