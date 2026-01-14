// ABOUTME: Utility functions for processing and creating tags
// ABOUTME: Handles tag creation logic used across bookmark creation/editing pages

import { db } from '$lib/db';
import type { ObjectOption } from 'svelte-multiselect';
import type { Tag, TagData } from '$lib/types';
import type { SvelteMap } from 'svelte/reactivity';

/**
 * Processes selected tags for saving to database:
 * - Filters new tags (those without database IDs) from existing tags
 * - Creates any new tags in the database via bulk insert
 * - Returns all tag IDs (existing + newly created) plus metadata for UI updates
 *
 * @param selectedTags - Array of tag options from multiselect component
 * @returns Object containing:
 *   - allTagIds: Combined array of all tag IDs (existing + new) for saving to database
 *   - newTagIds: Array of IDs for newly created tags (for UI state updates)
 *   - newTags: Array of new tag options without IDs (for UI mapping)
 */
export async function processTagsForSave(selectedTags: ObjectOption[]): Promise<{
	allTagIds: string[];
	newTagIds: string[];
	newTags: ObjectOption[];
}> {
	// Filter new tags (those without a value property or with null/undefined values)
	const newTags = selectedTags.filter(
		(opt) =>
			typeof opt !== 'object' || !('value' in opt) || opt.value === undefined || opt.value === null
	);

	// Extract existing tag IDs from tags that already have values
	const existingTagIds = selectedTags
		.filter(
			(opt) =>
				typeof opt === 'object' && 'value' in opt && opt.value !== undefined && opt.value !== null
		)
		.map((opt) => opt.value as string);

	// Create new tags in database if there are any
	let newTagIds: string[] = [];
	if (newTags.length > 0) {
		const newTagsData: TagData[] = newTags.map(
			(opt) =>
				({
					name: typeof opt === 'string' ? opt : opt.label,
					parentId: null,
					order: 0
				}) as TagData
		);
		// Bulk insert and get auto-generated IDs
		newTagIds = await db.tags.bulkAdd(newTagsData, { allKeys: true });
	}

	return {
		allTagIds: [...existingTagIds, ...newTagIds],
		newTagIds,
		newTags
	};
}

export function tagIdsToOptions(ids: string[], $tagMap: SvelteMap<string, Tag>): ObjectOption[] {
	return ids
		.filter((id: string) => $tagMap.has(id))
		.map((id: string) => {
			const tag = $tagMap.get(id) as Tag;
			return {
				value: tag.id,
				label: tag.getDisplayName()
			};
		});
}
