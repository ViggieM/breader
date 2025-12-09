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

<MultiSelect
	outerDivClass="input !min-h-10 h-auto !px-2"
	ulOptionsClass="!p-2 flex gap-2 flex-wrap !mt-3"
	liOptionClass="badge"
	liActiveOptionClass="badge-soft"
	liSelectedClass="badge badge-primary !bg-primary !text-primary-content"
	liUserMsgClass="text-xs"
	allowUserOptions="append"
	--sms-placeholder-opacity="0.7"
	placeholder="Select Tags"
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

<style>
	:global(div.multiselect > ul.options > li.selected) {
		--badge-color: var(--color-primary);
		background-color: color-mix(
			in oklab,
			var(--badge-color, var(--color-base-content)) 8%,
			var(--color-base-100)
		);
		border-color: color-mix(
			in oklab,
			var(--badge-color, var(--color-base-content)) 10%,
			var(--color-base-100)
		);
		background-image: none;
	}
	:global(div.multiselect > ul.options > li.active),
	:global(div.multiselect > ul.options > li:not(.selected):hover) {
		--badge-color: var(--color-primary);
		background-color: color-mix(
			in oklab,
			var(--badge-color, var(--color-base-content)) 8%,
			var(--color-base-100)
		);
		border-color: color-mix(
			in oklab,
			var(--badge-color, var(--color-base-content)) 10%,
			var(--color-base-100)
		);
		background-image: none;
	}
</style>
