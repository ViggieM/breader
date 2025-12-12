// ABOUTME: Utility functions for tag database operations
// ABOUTME: Provides centralized CRUD operations for tags to ensure consistency

import { db } from '$lib/db';

/**
 * Updates the parent of a tag, moving it in the hierarchy
 * @param tagId - ID of the tag to move
 * @param newParentId - ID of the new parent tag, or null for root level
 */
export async function updateTagParent(tagId: string, newParentId: string | null): Promise<void> {
	await db.tags.update(tagId, { parentId: newParentId });
}
