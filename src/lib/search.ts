import Fuse, { type FuseResult } from 'fuse.js';
import type { Bookmark } from '$lib/types';

export interface SearchOptions {
  threshold?: number;
  keys?: Array<{ name: string; weight: number }>;
}

export class FuseSearchEngine {
  private urlItems: Bookmark[] = [];
  private readonly fuse: Fuse<Bookmark> | null = null;
  private readonly searchOptions: SearchOptions;

  constructor(bookmarks: Bookmark[] = [], options: SearchOptions = {}) {
    const defaultOptions = {
      threshold: 0.3,
      keys: [
        { name: 'title', weight: 1.0 },
        { name: 'description', weight: 0.7 },
        { name: 'tags', weight: 0.5 },
        { name: 'keywords', weight: 0.4 },
      ],
    };

    this.searchOptions = { ...defaultOptions, ...options };
    this.fuse = new Fuse(bookmarks, this.searchOptions);
  }

  search(query: string): Bookmark[] {
    if (!query.trim() || !this.fuse) {
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
