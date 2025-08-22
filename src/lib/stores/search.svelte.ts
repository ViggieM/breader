import { liveQuery } from 'dexie';
import Fuse, { type FuseIndex, type FuseSearchOptions } from 'fuse.js';
import { derived, writable } from 'svelte/store';
import { db } from '$lib/db';
import type { BookmarkData } from '$lib/types';

export const filters = writable({
  query: '',
  isReviewed: false,
  isStarred: false,
});

const bookmarksData = liveQuery(() => db.bookmarks.toArray());

class FuseSearchEngine {
  public data: BookmarkData[];
  private readonly fuse: Fuse<BookmarkData>;

  constructor(
    data: BookmarkData[],
    options?: FuseSearchOptions,
    index?: FuseIndex<BookmarkData>,
  ) {
    const defaultOptions = {
      threshold: 0.3,
      keys: [
        { name: 'title', weight: 1.0 },
        { name: 'keywords', weight: 0.7 },
        { name: 'tags', weight: 0.5 },
      ],
    };
    const searchOptions = { ...defaultOptions, ...options };
    this.data = data;
    this.fuse = new Fuse(data, searchOptions, index);
  }

  search(query: string): BookmarkData[] {
    if (!query.trim()) {
      return this.data;
    }
    return this.fuse.search(query).map((result) => result.item);
  }
}

export const engine = derived(
  bookmarksData,
  ($bookmarksData) => new FuseSearchEngine($bookmarksData),
);
