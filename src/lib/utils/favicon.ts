function getDomainFromUrl(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}

export function getFavicon(url: string): string {
	const domain = getDomainFromUrl(url);
	return `https://www.google.com/s2/favicons?domain=${domain}`;
}
