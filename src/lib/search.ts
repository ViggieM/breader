import Fuse, { type FuseResult } from 'fuse.js';
import type { Bookmark } from '$lib/types';

export interface SearchOptions {
  threshold?: number;
  keys?: Array<{ name: string; weight: number }>;
}

export class FuseSearchEngine {
  private fuse: Fuse<Bookmark>;
  private readonly urlItems: Bookmark[];

  constructor(urlItems: Bookmark[], options: SearchOptions = {}) {
    this.urlItems = urlItems;

    const defaultOptions = {
      threshold: 0.3,
      keys: [
        { name: 'title', weight: 1.0 },
        { name: 'description', weight: 0.7 },
        { name: 'tags', weight: 0.5 },
        { name: 'keywords', weight: 0.4 },
      ],
    };

    const fuseOptions = { ...defaultOptions, ...options };
    this.fuse = new Fuse(urlItems, fuseOptions);
  }

  search(query: string): Bookmark[] {
    if (!query.trim()) {
      return [];
    }

    const results = this.fuse.search(query);
    return results.map((result: FuseResult<Bookmark>) => result.item);
  }

  getAllUrlItems(): Bookmark[] {
    return this.urlItems;
  }

  getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.urlItems.forEach((item) => {
      item.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }
}

export async function createSearchEngine(): Promise<FuseSearchEngine> {
  // Import BookmarkStore to access localStorage bookmarks
  const { bookmarkStore } = await import('$lib/stores/bookmarks');

  // Get bookmarks from localStorage
  const bookmarks = Object.values(bookmarkStore.getAllBookmarks());

  return new FuseSearchEngine(bookmarks);
}
