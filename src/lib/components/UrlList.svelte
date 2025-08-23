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
</script>

<ul class="UrlList">
	{#each items as bookmark (bookmark.id)}
		<li id={bookmark.id}>
			<details>
				<summary
					class={bookmark.isReviewed ? '' : 'font-bold'}
					ondblclick={(evt) => handleDoubleClick(evt, bookmark)}
				>
					<img src={bookmark.faviconUrl} alt="favicon" draggable="false" />
					<span>{bookmark.title}</span>
				</summary>
				<article>
					<p>{bookmark.description}</p>
					<footer>
						<span
							>Added on <time datetime={bookmark.created}>{formatDate(bookmark.created)}</time
							></span
						>
						{#if bookmark.hasBody}
							<a href={bookmark.localUrl}>See more →</a>
						{:else}
							<a href={bookmark.url}>Go to page →</a>
						{/if}
					</footer>
				</article>
			</details>
			<details class="dropdown dropdown-end absolute right-0 top-0">
				<summary><span class="text-lg icon-[ri--more-2-line]"></span></summary>
				<ul class="dropdown-content menu">
					<li>
						<label class="flex justify-between">
							Mark as read
							<input
								type="checkbox"
								class="checkbox checkbox-xs"
								checked={bookmark.isReviewed}
								onchange={(event) => markAsRead(event, bookmark.id)}
							/>
						</label>
					</li>
					<li>
						<a href={bookmark.localUrl} class="flex justify-between">
							Edit <span class="size-4 icon-[ri--pencil-line]"></span>
						</a>
					</li>
					<li>
						<button class="flex justify-between text-error">
							Delete <span class="size-4 icon-[ri--delete-bin-6-line]"></span>
						</button>
					</li>
				</ul>
			</details>
		</li>
	{/each}
</ul>
