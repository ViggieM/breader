import { SvelteMap } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { FuseSearchEngine } from '$lib/search';
import { Bookmark } from '$lib/types';

export interface SearchOptions {
  reviewed: boolean;
}

export class BookmarkStore {
  private readonly storageKey = 'bookmarks';
  private bookmarks = new SvelteMap<string, Bookmark>();
  private engine: FuseSearchEngine | null = null;
  private initialized = false;

  constructor() {
    // Initialize on client-side only
    if (browser) {
      this.loadBookmarks();
    }
  }

  private loadBookmarks(): void {
    if (!browser) return;

    const stored = localStorage.getItem(this.storageKey);
    const data = stored ? JSON.parse(stored) : {};

    // Convert plain objects to Bookmark instances and update reactive state
    for (const [id, bookmarkData] of Object.entries(data)) {
      this.bookmarks.set(id, new Bookmark(bookmarkData as any));
    }

    this.engine = new FuseSearchEngine([...this.bookmarks.values()]);
  }

  searchBookmarks(query: string, options: SearchOptions): Bookmark[] {
    let results: Bookmark[] = [];
    if (query.trim()) {
      results = this.engine?.search(query) || [];
    } else {
      results = [...this.bookmarks.values()];
    }

    return results.filter(
      (bookmark) => !options.reviewed || !bookmark.reviewed,
    );
  }

  private saveBookmarks(): void {
    if (!browser) return;

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(Object.fromEntries(this.bookmarks)),
    );
  }

  createBookmark(data: Partial<Bookmark>): Bookmark {
    const now = new Date().toISOString();

    const bookmark = new Bookmark({
      id: crypto.randomUUID(),
      title: data.title || '',
      url: data.url || '',
      description: data.description || '',
      created: now,
      modified: now,
      tags: data.tags ?? [],
      keywords: data.keywords ?? [],
      reviewed: data.reviewed ?? false,
      starred: data.starred ?? false,
      hasBody: data.hasBody ?? false,
    });

    // Update reactive state
    this.bookmarks.set(bookmark.id, bookmark);
    this.saveBookmarks();

    return bookmark;
  }

  getBookmark(id: string): Bookmark | null {
    return this.bookmarks.get(id) ?? null;
  }

  // Reactive getter for bookmarks as array (commonly used in components)
  getAllBookmarksArray(): Bookmark[] {
    // Ensure we load bookmarks if not yet initialized (for client-side hydration)
    if (!this.initialized && browser) {
      this.loadBookmarks();
    }
    return Object.values(this.bookmarks);
  }

  updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
    const bookmark = this.bookmarks.get(id);

    if (!bookmark) return null;

    const updatedBookmark = new Bookmark({
      id: bookmark.id,
      title: updates.title ?? bookmark.title,
      url: updates.url ?? bookmark.url,
      description: updates.description ?? bookmark.description,
      created: bookmark.created,
      modified: new Date().toISOString(),
      tags: updates.tags ?? bookmark.tags,
      keywords: updates.keywords ?? bookmark.keywords,
      reviewed: updates.reviewed ?? bookmark.reviewed,
      starred: updates.starred ?? bookmark.starred,
      hasBody: updates.hasBody ?? bookmark.hasBody,
    });

    // Update reactive state
    this.bookmarks.set(id, updatedBookmark);
    this.saveBookmarks();

    return updatedBookmark;
  }

  deleteBookmark(id: string): boolean {
    if (!this.bookmarks.has(id)) return false;

    // Update reactive state
    this.bookmarks.delete(id);
    this.saveBookmarks();

    return true;
  }
}

export const bookmarkStore = new BookmarkStore();
