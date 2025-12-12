<!-- ABOUTME: Main navigation menu component that displays favorites, archive, notes, untagged bookmarks, -->
<!-- ABOUTME: and hierarchical tag structure with collapsible sections and nested bookmarks -->

<script lang="ts">
	import { navigationData } from '$lib/stores/navigation.svelte';
	import NavigationMenuItem from './NavigationMenuItem.svelte';
	import { onMount } from 'svelte';

	// Persistent state for untagged section
	const untaggedStorageKey = 'navigation-expanded-untagged';
	let untaggedIsOpen = $state(false);
	let untaggedDetailsElement = $state<HTMLDetailsElement>();

	onMount(() => {
		const saved = localStorage.getItem(untaggedStorageKey);
		if (saved !== null) {
			untaggedIsOpen = saved === 'true';
		}
	});

	function handleUntaggedToggle() {
		if (untaggedDetailsElement) {
			untaggedIsOpen = untaggedDetailsElement.open;
			localStorage.setItem(untaggedStorageKey, String(untaggedIsOpen));
		}
	}
</script>

{#if $navigationData}
	<ul class="menu rounded-box w-full p-0 mt-4">
		<!-- Static top-level links -->
		<li>
			<a href="/list/favorites" aria-label="View favorite bookmarks">
				<span class="icon-[ri--star-line] shrink-0" aria-hidden="true"></span>
				Favorites
			</a>
		</li>
		<li>
			<a href="/list/archived" aria-label="View archived bookmarks">
				<span class="icon-[ri--archive-2-line] shrink-0" aria-hidden="true"></span>
				Archive
			</a>
		</li>
		<li>
			<a href="/list/notes" aria-label="View notes">
				<span class="icon-[ri--sticky-note-line] shrink-0" aria-hidden="true"></span>
				Notes
			</a>
		</li>

		<hr class="text-base-300 my-2" />

		<!-- Untagged bookmarks section -->
		{#if $navigationData.untagged.length > 0}
			<li>
				<details
					bind:this={untaggedDetailsElement}
					open={untaggedIsOpen}
					ontoggle={handleUntaggedToggle}
				>
					<summary
						class="font-normal"
						aria-label="Untagged bookmarks ({$navigationData.untagged.length})"
					>
						<span class="icon-[ri--bookmark-line] shrink-0" aria-hidden="true"></span>
						Untagged
						<span class="badge badge-sm">{$navigationData.untagged.length}</span>
					</summary>
					<ul>
						{#each $navigationData.untagged as bookmark (bookmark.id)}
							<li>
								<a href="/bookmark/{bookmark.id}" aria-label="Open {bookmark.title || 'Untitled'}">
									<img
										src={bookmark.faviconUrl}
										alt=""
										draggable="false"
										loading="lazy"
										class="w-4 h-4 shrink-0"
										onerror={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
									/>
									<span class="truncate">{bookmark.title || 'Untitled'}</span>
								</a>
							</li>
						{/each}
					</ul>
				</details>
			</li>
		{/if}

		<!-- Tag tree with nested tags and bookmarks -->
		{#each $navigationData.tagTree as tagNode (tagNode.tag.id)}
			<NavigationMenuItem node={tagNode} />
		{/each}

		<!-- Empty state -->
		{#if $navigationData.tagTree.length === 0 && $navigationData.untagged.length === 0}
			<li class="text-center py-4 text-base-content/60">
				<p>No bookmarks yet</p>
			</li>
		{/if}
	</ul>
{:else}
	<!-- Loading state -->
	<div class="flex justify-center items-center p-8">
		<span class="loading loading-spinner loading-lg"></span>
	</div>
{/if}
