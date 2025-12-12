<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib';
	import { deleteBookmark as deleteBookmarkUtil } from '$lib/db/bookmarks';
	import type { Bookmark } from '$lib/types';
	import { marked } from 'marked';

	let { items } = $props();

	function handleDoubleClick(evt: MouseEvent, item: Bookmark) {
		evt.preventDefault();
		if (item.hasBody) {
			goto(item.localUrl);
		} else {
			// https://stackoverflow.com/a/78836355
			(window as Window).location = item.url;
		}
	}

	async function deleteBookmark(event: Event, bookmarkId: string) {
		if (confirm('Are you sure you want to delete this bookmark?')) {
			await deleteBookmarkUtil(bookmarkId);
		}
	}

	function handleToggle(event: Event) {
		const currentDetails = event.target as HTMLDetailsElement;
		if (currentDetails.open) {
			// Close all other details elements
			const allDetails = document.querySelectorAll('.url-list-item details');
			allDetails.forEach((details) => {
				if (details !== currentDetails) {
					details.removeAttribute('open');
				}
			});

			// Scroll the opened details into view
			currentDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}
</script>

<ul class="space-y-1 lg:space-y-0">
	{#each items as bookmark (bookmark.id)}
		<li id={bookmark.id} class="url-list-item">
			<details class="group" ontoggle={handleToggle}>
				<summary ondblclick={(evt) => handleDoubleClick(evt, bookmark)}>
					<img
						src={bookmark.faviconUrl}
						alt=""
						draggable="false"
						onerror={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
						loading="lazy"
					/>
					<span class="group-not-open:truncate">{bookmark.title}</span>
				</summary>
				<article>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p class="prose">{@html marked(bookmark.description || '')}</p>
					<div class="flex items-center justify-end mt-2">
						{#if bookmark.hasBody}
							<a href={bookmark.localUrl} class="link">See more →</a>
						{:else}
							<a href={bookmark.url} class="link">Go to page →</a>
						{/if}
					</div>
					<footer class="pt-3 border-t border-base-content/10 flex items-center gap-6">
						<div class="flex items-center gap-4">
							<span class="text-base-content/60 text-xs">
								Added on <time datetime={bookmark.created}>{formatDate(bookmark.created)}</time>
							</span>
						</div>
						<div class="flex items-center gap-4">
							<a href={bookmark.localUrl} class="link text-sm flex items-center gap-1.5">
								<span class="size-4 icon-[ri--pencil-line]"></span> Edit
							</a>
							<button
								class="link link-error text-sm flex items-center gap-1.5"
								onclick={(event) => deleteBookmark(event, bookmark.id)}
							>
								<span class="size-4 icon-[ri--delete-bin-6-line]"></span> Delete
							</button>
						</div>
					</footer>
				</article>
			</details>
		</li>
	{/each}
</ul>
