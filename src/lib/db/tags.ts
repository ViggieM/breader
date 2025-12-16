// ABOUTME: Utility functions for tag database operations
// ABOUTME: Provides centralized CRUD operations for tags to ensure consistency

import { db } from '$lib/db';
import { updateBookmarkTags } from './bookmarks';
import { toastSuccess, toastError } from '$lib/stores/notifications.svelte';

/**
 * Updates the parent of a tag, moving it in the hierarchy
 * @param tagId - ID of the tag to move
 * @param newParentId - ID of the new parent tag, or null for root level
 */
export async function updateTagParent(tagId: string, newParentId: string | null): Promise<void> {
	await db.tags.update(tagId, { parentId: newParentId });
}

/**
 * Updates the name of a tag
 * @param tagId - ID of the tag to rename
 * @param newName - New name for the tag
 */
export async function updateTagName(tagId: string, newName: string): Promise<void> {
	try {
		await db.tags.update(tagId, { name: newName });
		toastSuccess('Tag renamed');
	} catch (error) {
		toastError('Failed to rename tag');
		throw error;
	}
}

/**
 * Removes a deleted tag from all bookmarks and optionally substitutes it with the parent tag
 * @param tagId - ID of the tag being deleted
 * @param parentTagId - ID of the parent tag to substitute, or null if no parent
 * @returns Object containing the count of updated bookmarks
 *
 * @example
 * // Delete tag and substitute with parent
 * await removeTagFromBookmarks('tag-123', 'parent-456');
 *
 * // Delete root tag (no parent substitution)
 * await removeTagFromBookmarks('tag-123', null);
 */
export async function removeTagFromBookmarks(
	tagId: string,
	parentTagId: string | null
): Promise<{ updatedBookmarks: number }> {
	// Query all bookmarks that contain this tag
	const bookmarks = await db.bookmarks.where('tags').equals(tagId).toArray();

	// Update each bookmark
	await Promise.all(
		bookmarks.map(async (bookmark) => {
			// Remove the deleted tag from the tags array
			let newTags = bookmark.tags.filter((id) => id !== tagId);

			// If there's a parent tag and it's not already in the tags, add it
			if (parentTagId && !newTags.includes(parentTagId)) {
				newTags.push(parentTagId);
			}

			// Update the bookmark with the new tags
			await updateBookmarkTags(bookmark.id, newTags);
		})
	);

	return { updatedBookmarks: bookmarks.length };
}

/**
 * Reassigns child tags when their parent is deleted
 * Children are moved to their grandparent (or root level if no grandparent)
 * @param deletedTagId - ID of the tag being deleted
 * @param grandparentId - ID of the parent's parent tag, or null for root level
 * @returns Object containing the count of reassigned tags
 *
 * @example
 * // Tag with parent is deleted: children move to grandparent
 * await reassignChildTags('tag-123', 'grandparent-456');
 *
 * // Root tag is deleted: children become root tags
 * await reassignChildTags('tag-123', null);
 */
export async function reassignChildTags(
	deletedTagId: string,
	grandparentId: string | null
): Promise<{ reassignedTags: number }> {
	// Query all tags that have the deleted tag as their parent
	const childTags = await db.tags.where('parentId').equals(deletedTagId).toArray();

	// Early return if no children
	if (childTags.length === 0) {
		return { reassignedTags: 0 };
	}

	// Update each child tag's parent to the grandparent (or null for root)
	await Promise.all(childTags.map(async (tag) => await updateTagParent(tag.id, grandparentId)));

	return { reassignedTags: childTags.length };
}

/**
 * Deletes a tag and handles all cascading updates
 * This orchestrates:
 * 1. Removing the tag from all bookmarks (with optional parent substitution)
 * 2. Reassigning child tags to grandparent or root level
 * 3. Deleting the tag from the database
 *
 * All operations are performed in a transaction for atomicity.
 *
 * @param tagId - ID of the tag to delete
 * @returns Summary object with deletion statistics
 * @throws Error if tag doesn't exist
 *
 * @example
 * const result = await deleteTag('tag-123');
 * console.log(`Deleted tag, updated ${result.updatedBookmarks} bookmarks, reassigned ${result.reassignedTags} child tags`);
 */
export async function deleteTag(tagId: string): Promise<{
	deletedTagId: string;
	updatedBookmarks: number;
	reassignedTags: number;
}> {
	try {
		// Fetch the tag to get its parentId
		const tag = await db.tags.get(tagId);
		if (!tag) {
			throw new Error(`Tag with ID ${tagId} not found`);
		}

		// Perform all operations in a transaction for atomicity
		let updatedBookmarks = 0;
		let reassignedTags = 0;

		await db.transaction('rw', [db.bookmarks, db.tags], async () => {
			// Step 1: Remove tag from bookmarks and substitute with parent if exists
			const bookmarkResult = await removeTagFromBookmarks(tagId, tag.parentId);
			updatedBookmarks = bookmarkResult.updatedBookmarks;

			// Step 2: Reassign child tags to grandparent (or null for root)
			const childResult = await reassignChildTags(tagId, tag.parentId);
			reassignedTags = childResult.reassignedTags;

			// Step 3: Delete the tag itself
			await db.tags.delete(tagId);
		});

		toastSuccess('Tag deleted');

		return {
			deletedTagId: tagId,
			updatedBookmarks,
			reassignedTags
		};
	} catch (error) {
		toastError('Failed to delete tag');
		throw error;
	}
}
