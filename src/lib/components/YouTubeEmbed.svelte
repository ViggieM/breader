<!-- ABOUTME: YouTube video embed component with responsive aspect ratio -->
<!-- ABOUTME: Uses 16:9 aspect ratio container and standard YouTube embed URL -->
<script lang="ts">
	import { getYouTubeEmbedUrl } from '$lib/utils/youtube';

	type YouTubeEmbedProps = {
		videoId: string;
		title?: string;
	};

	let { videoId, title = 'YouTube video' }: YouTubeEmbedProps = $props();

	const embedUrl = $derived(getYouTubeEmbedUrl(videoId));
</script>

<div class="youtube-embed-container">
	<iframe
		src={embedUrl}
		{title}
		frameborder="0"
		allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
		allowfullscreen
		class="youtube-embed-iframe"
	></iframe>
</div>

<style>
	.youtube-embed-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		height: 0;
		overflow: hidden;
		border-radius: 0.5rem; /* DaisyUI rounded-lg equivalent */
	}

	.youtube-embed-iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
