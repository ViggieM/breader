<script lang="ts">
	import OverType, { type OverTypeInstance } from 'overtype';
	import { onMount } from 'svelte';

	let { content = $bindable(), ...options } = $props();

	const initialValue = content;
	let node = $state() as HTMLDivElement;
	let editor = $state() as OverTypeInstance;

	onMount(() => {
		[editor] = OverType.init(node, {
			toolbar: false,
			value: initialValue,
			padding: '0',
			autoResize: true,
			onChange: (value) => {
				content = value;
			},
			theme: {
				colors: {
					bgPrimary: 'var(--color-base-100)',
					bgSecondary: 'var(--color-base-200)',
					text: 'var(--color-base-content)',
					h1: 'var(--color-error)',
					h2: 'var(--color-warning)',
					h3: 'var(--color-success)',
					strong: 'var(--color-warning)',
					em: 'var(--color-error)',
					link: 'var(--color-primary)',
					code: 'var(--color-info-content)',
					codeBg: 'var(--color-info)',
					blockquote: 'var(--color-accent)',
					hr: 'var(--color-neutral-content)',
					syntaxMarker: 'var(--color-secondary-content)',
					cursor: 'var(--color-error)',
					selection: 'color-mix(in oklab, var(--color-secondary) 50%)'
				}
			},
			...options
		});
	});

	export function resetEditor() {
		editor.setValue(initialValue);
	}
	export function reinit() {
		editor.reinit();
	}
</script>

<div bind:this={node}></div>
