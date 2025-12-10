import { db } from '$lib/db';
import { Tag, type TagData } from '$lib/types';
import { liveQuery } from 'dexie';
import type { ObjectOption } from 'svelte-multiselect';
import { SvelteMap } from 'svelte/reactivity';
import { derived, readable } from 'svelte/store';

export const tagsData = readable<TagData[]>([], (set) => {
	const observable = liveQuery(() => db.tags.toArray());
	const subscription = observable.subscribe((data) => {
		if (data) set(data);
	});

	return () => subscription.unsubscribe();
});

const tagInstances = derived(tagsData, (tagsData) => {
	return tagsData.map((data) => new Tag(data));
});

export const tagMap = derived(tagInstances, ($tagInstances) => {
	const map = new SvelteMap<string, Tag>();
	$tagInstances.forEach((tag) => map.set(tag.id, tag));
	return map;
});

export const childrenMap = derived(tagInstances, ($tagInstances) => {
	const map = new SvelteMap<string, string[]>();
	$tagInstances.forEach((tag) => {
		const parentId = tag.parentId || 'root';
		if (!map.has(parentId)) map.set(parentId, []);
		map.get(parentId)!.push(tag.id);
	});
	return map;
});

export const ancestorMap = derived([tagInstances, tagMap], ([$tagInstances, $tagMap]) => {
	const map = new SvelteMap<string, string[]>();
	$tagInstances.forEach((tag) => {
		const ancestors: string[] = [];
		let current = tag.parentId;
		while (current && $tagMap.get(current)) {
			ancestors.push(current);
			current = $tagMap.get(current)!.parentId;
		}
		map.set(tag.id, ancestors);
	});
	return map;
});

export const descendantMap = derived(
	[tagInstances, childrenMap],
	([$tagInstances, $childrenMap]) => {
		const map = new SvelteMap<string, string[]>();
		const getDescendants = (tagId: string): string[] => {
			const children = $childrenMap.get(tagId) || [];
			const descendants = [...children];
			children.forEach((childId) => {
				descendants.push(...getDescendants(childId));
			});
			return descendants;
		};

		$tagInstances.forEach((tag) => {
			map.set(tag.id, getDescendants(tag.id));
		});
		return map;
	}
);
