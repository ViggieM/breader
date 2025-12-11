<script lang="ts">
	import type { Tag } from '$lib/types';
	import MultiSelect, { type ObjectOption } from 'svelte-multiselect';
	import { descendantMap, ancestorMap, childrenMap, tagMap } from '$lib/stores/tags.svelte';
	import { derived } from 'svelte/store';

	let {
		selectedTags = $bindable(),
		onAdd,
		onRemove,
		onRemoveAll
	}: {
		selectedTags: ObjectOption[];
		onAdd?: () => void;
		onRemove?: () => void;
		onRemoveAll?: () => void;
	} = $props();

	const options = derived([childrenMap, tagMap], ([childrenMap, tagMap]) => {
		const result: ObjectOption[] = [];
		for (const tagID of childrenMap.get('root') || []) {
			const tag = tagMap.get(tagID) as Tag;
			result.push({
				value: tag.id,
				label: tag.getDisplayName()
			});
			appendChildren(tag);
		}

		function appendChildren(tag: Tag) {
			for (const tagId of childrenMap.get(tag.id) || []) {
				const tag = tagMap.get(tagId) as Tag;
				result.push({
					value: tag.id,
					label: tag.getDisplayName()
				});
				appendChildren(tag);
			}
		}
		return result;
	});

	function handleAdd(data: { option: ObjectOption }) {
		onAdd?.();
		const tagId = data.option.value as string;
		const newTags = selectedTags.filter((option) => !('value' in option));
		const uniqueTags = [
			...new Map(
				selectedTags.filter((opt) => 'value' in opt).map((opt) => [opt.value, opt])
			).values()
		];
		selectedTags = [...uniqueTags, ...newTags];
		$descendantMap.get(tagId)?.forEach((id) => {
			selectedTags = selectedTags.filter((tag) => tag.value !== id);
		});
		$ancestorMap.get(tagId)?.forEach((id) => {
			selectedTags = selectedTags.filter((tag) => tag.value !== id);
		});
	}

	function handleRemove() {
		onRemove?.();
	}
</script>

<label class="floating-label">
	<span class="z-20">Tags</span>
	<MultiSelect
		outerDivClass="input !min-h-10 h-auto !px-2"
		ulOptionsClass="!p-2 flex gap-2 flex-wrap !mt-3"
		liOptionClass="badge badge-outline badge-primary"
		liActiveOptionClass="badge badge-soft badge-primary"
		liSelectedClass="badge badge-primary"
		liUserMsgClass="text-xs"
		allowUserOptions="append"
		placeholder="Tags"
		bind:selected={selectedTags}
		options={$options}
		selectedOptionsDraggable={false}
		closeDropdownOnSelect={false}
		duplicates={true}
		onadd={handleAdd}
		onremove={handleRemove}
		onremoveAll={onRemoveAll}
		--sms-options-border-width="0px"
		--sms-active-color="var(--color-neutral)"
	>
		{#snippet expandIcon()}{/snippet}
	</MultiSelect>
</label>

<style>
	.floating-label > span {
		z-index: 10;
	}
	/* Selected badges in input area and dropdown - ensure full primary styling */
	:global(div.multiselect > ul:not(.options) > li),
	:global(div.multiselect > ul.options > li.selected) {
		--badge-color: var(--color-primary);
		--badge-fg: var(--color-primary-content);
		background-color: var(--color-primary) !important;
		color: var(--color-primary-content) !important;
		border-color: var(--color-primary) !important;
		border-width: 1px !important;
	}

	/* Active (hovered/keyboard focus) badges - use soft style */
	:global(div.multiselect > ul.options > li.active:not(.selected)),
	:global(div.multiselect > ul.options > li:not(.selected):hover) {
		--badge-color: var(--color-primary);
		background-color: color-mix(
			in oklab,
			var(--color-primary) 8%,
			var(--color-base-100)
		) !important;
		border-color: color-mix(in oklab, var(--color-primary) 10%, var(--color-base-100)) !important;
		border-width: 1px !important;
		color: var(--color-primary) !important;
	}

	/* Unselected, unfocused badges - outline style */
	:global(div.multiselect > ul.options > li:not(.selected):not(.active):not(:hover)) {
		background-color: transparent !important;
		border-color: var(--color-primary) !important;
		border-width: 1px !important;
		color: var(--color-primary) !important;
	}
	:global(div.multiselect > ul > input[autocomplete]) {
		&::placeholder {
			font-size: 0.875rem;
			position: relative;
			left: -3px;
			opacity: 1;
			color: color-mix(in oklch, currentColor 50%, #0000) !important;
		}
	}
	:global(div.multiselect > ul > input[autocomplete]:focus::placeholder),
	:global(div.multiselect.open > ul > input[autocomplete]::placeholder),
	:global(label.floating-label:focus-within input[autocomplete]::placeholder) {
		opacity: 0 !important;
		transition: opacity 0.1s ease !important;
	}
</style>
