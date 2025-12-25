// ABOUTME: YouTube URL detection and video ID extraction utilities
// ABOUTME: Supports youtube.com, youtu.be, shorts, and embed URL formats

export interface YouTubeVideoInfo {
	videoId: string;
	urlType: 'watch' | 'shorts' | 'embed' | 'short';
}

/**
 * Detects if a URL is a YouTube video and extracts the video ID
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - http variants and with/without www
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo | null {
	try {
		const urlObj = new URL(url);
		const hostname = urlObj.hostname.toLowerCase();

		// Check if it's a YouTube domain
		if (!hostname.includes('youtube.com') && hostname !== 'youtu.be') {
			return null;
		}

		// Extract video ID based on URL format
		let videoId: string | null = null;
		let urlType: YouTubeVideoInfo['urlType'] = 'watch';

		if (hostname === 'youtu.be') {
			// Short URL: https://youtu.be/VIDEO_ID
			videoId = urlObj.pathname.slice(1).split('?')[0];
			urlType = 'short';
		} else if (urlObj.pathname.startsWith('/shorts/')) {
			// Shorts: https://youtube.com/shorts/VIDEO_ID
			videoId = urlObj.pathname.split('/shorts/')[1]?.split('?')[0] || null;
			urlType = 'shorts';
		} else if (urlObj.pathname.startsWith('/embed/')) {
			// Embed: https://youtube.com/embed/VIDEO_ID
			videoId = urlObj.pathname.split('/embed/')[1]?.split('?')[0] || null;
			urlType = 'embed';
		} else {
			// Standard watch URL: https://youtube.com/watch?v=VIDEO_ID
			videoId = urlObj.searchParams.get('v');
			urlType = 'watch';
		}

		// Validate video ID (11 characters alphanumeric + - _)
		if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
			return { videoId, urlType };
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Generates YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
	return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Quick check if URL is a YouTube video
 */
export function isYouTubeVideo(url: string): boolean {
	return parseYouTubeUrl(url) !== null;
}
