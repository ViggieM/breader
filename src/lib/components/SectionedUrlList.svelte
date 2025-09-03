<!-- ABOUTME: Component that renders bookmark sections with hierarchical headings -->
<!-- ABOUTME: Organizes bookmarks by tags with proper heading levels h2-h6 -->

<script lang="ts">
	import UrlList from './UrlList.svelte';
	import type { TagSection } from '$lib/utils/sectionUtils';

	let { sections } = $props<{ sections: TagSection[] }>();
</script>

<div>
	{#each sections as section (section.tag?.id || 'untagged')}
		<section>
			{#if section.level === 1}
				<h2 class="text-base font-medium text-base-content/70">
					{section.tag.getDisplayName()}
				</h2>
			{:else if section.level === 2}
				<h3 class="text-sm font-normal text-base-content/70 mt-1">
					{section.tag.getDisplayName()}
				</h3>
			{:else if section.level === 3}
				<h4 class="text-sm font-normal text-base-content/70 mt-1">
					{section.tag.getDisplayName()}
				</h4>
			{:else if section.level === 4}
				<h5 class="text-sm font-normal text-base-content/60 mt-1">
					{section.tag.getDisplayName()}
				</h5>
			{:else if section.level >= 5}
				<h6 class="text-xs font-normal text-base-content/60 mt-1">
					{section.tag.getDisplayName()}
				</h6>
			{/if}

			{#if section.bookmarks.length > 0}
				<div>
					<UrlList items={section.bookmarks} />
				</div>
			{/if}
		</section>
	{/each}
</div>
