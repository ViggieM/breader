function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export class Bookmark {
  // automatically generated
  id: string; // UUID v4
  created: string;
  modified: string;
  keywords: string[]; // used for search

  // editable
  title: string;
  url: string;
  description: string;
  reviewed: boolean;
  starred: boolean;
  tags: string[];
  hasBody: boolean; // todo: this should be determined, whether or not there are notes

  constructor(data: Omit<Bookmark, 'faviconUrl' | 'localUrl'>) {
    this.id = data.id;
    this.created = data.created;
    this.modified = data.modified;
    this.keywords = data.keywords;
    this.title = data.title;
    this.url = data.url;
    this.description = data.description;
    this.reviewed = data.reviewed;
    this.starred = data.starred;
    this.tags = data.tags;
    this.hasBody = data.hasBody;
  }

  get faviconUrl(): string {
    const domain = getDomainFromUrl(this.url);
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  }

  get localUrl(): string {
    return `/${this.id}`;
  }
}
