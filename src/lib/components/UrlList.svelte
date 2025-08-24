<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate } from '$lib';
	import { db } from '$lib/db';
	import type { Bookmark } from '$lib/types';

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

	function markAsRead(event: Event, bookmarkId: string) {
		const target = event.target as HTMLInputElement;
		db.bookmarks.update(bookmarkId, { isReviewed: target.checked });
	}

	function deleteBookmark(event: Event, bookmarkId: string) {
		db.bookmarks.delete(bookmarkId);
	}
</script>

<ul class="UrlList">
	{#each items as bookmark (bookmark.id)}
		<li id={bookmark.id}>
			<details>
				<summary
					class={bookmark.isReviewed ? '' : 'font-bold'}
					ondblclick={(evt) => handleDoubleClick(evt, bookmark)}
				>
					<img
						src={bookmark.faviconUrl}
						alt=""
						draggable="false"
						onerror={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
						loading="lazy"
					/>
					<span>{bookmark.title}</span>
				</summary>
				<article>
					<p>{bookmark.description}</p>
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
							<label class="flex items-center gap-1.5 cursor-pointer">
								<input
									type="checkbox"
									class="checkbox checkbox-xs"
									checked={bookmark.isReviewed}
									onchange={(event) => markAsRead(event, bookmark.id)}
								/>
								<span class="text-sm">Read</span>
							</label>
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
