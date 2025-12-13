// ABOUTME: Shared drag state for mobile drag-and-drop fallback when dataTransfer fails
// ABOUTME: Stores currently dragged item ID and type for use across navigation components

let currentDragData = $state<{
	type: 'bookmark' | 'tag' | null;
	id: string | null;
}>({ type: null, id: null });

export const dragState = {
	set(type: 'bookmark' | 'tag', id: string) {
		currentDragData = { type, id };
		console.log('💾 [DRAG STATE] Stored fallback:', { type, id });
	},

	get(): { type: 'bookmark' | 'tag' | null; id: string | null } {
		return currentDragData;
	},

	getBookmarkId(): string | null {
		return currentDragData.type === 'bookmark' ? currentDragData.id : null;
	},

	getTagId(): string | null {
		return currentDragData.type === 'tag' ? currentDragData.id : null;
	},

	clear() {
		console.log('🧹 [DRAG STATE] Cleared fallback');
		currentDragData = { type: null, id: null };
	}
};
