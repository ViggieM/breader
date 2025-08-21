import { Bookmark } from '$lib/types';

export class BookmarkStore {
  private readonly storageKey = 'bookmarks';

  private getBookmarks(): Record<string, Bookmark> {
    if (typeof window === 'undefined') return {};

    const stored = localStorage.getItem(this.storageKey);
    const data = stored ? JSON.parse(stored) : {};

    // Convert plain objects to Bookmark instances
    const bookmarks: Record<string, Bookmark> = {};
    for (const [id, bookmarkData] of Object.entries(data)) {
      bookmarks[id] = new Bookmark(bookmarkData as any);
    }
    return bookmarks;
  }

  private saveBookmarks(bookmarks: Record<string, Bookmark>): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.storageKey, JSON.stringify(bookmarks));
  }

  createBookmark(data: Partial<Bookmark>): Bookmark {
    const bookmarks = this.getBookmarks();
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

    bookmarks[bookmark.id] = bookmark;
    this.saveBookmarks(bookmarks);

    return bookmark;
  }

  getBookmark(id: string): Bookmark | null {
    const bookmarks = this.getBookmarks();
    return bookmarks[id] ?? null;
  }

  getAllBookmarks(): Record<string, Bookmark> {
    return this.getBookmarks();
  }

  updateBookmark(id: string, updates: Partial<Bookmark>): Bookmark | null {
    const bookmarks = this.getBookmarks();
    const bookmark = bookmarks[id];

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

    bookmarks[id] = updatedBookmark;
    this.saveBookmarks(bookmarks);

    return updatedBookmark;
  }

  deleteBookmark(id: string): boolean {
    const bookmarks = this.getBookmarks();

    if (!bookmarks[id]) return false;

    delete bookmarks[id];
    this.saveBookmarks(bookmarks);

    return true;
  }
}

export const bookmarkStore = new BookmarkStore();
