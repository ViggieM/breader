<script lang="ts">
import { goto } from '$app/navigation';
import { formatDate } from '$lib';
import { bookmarkStore } from '$lib/stores/bookmarks.svelte';
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
  bookmarkStore.updateBookmark(bookmarkId, { reviewed: target.checked });
}
</script>

<ul class="UrlList">
  {#each items as item (item.id)}
    <li id={item.id}>
      <details >
        <summary class="{item.reviewed ? '' : 'font-bold'}" ondblclick={(evt) => handleDoubleClick(evt, item)}>
            <img
              src={item.faviconUrl}
              alt="favicon"
              draggable="false"
            />
            <span>{item.title}</span>
        </summary>
        <article>
          <p>{item.description}</p>
          <footer>
            <span>Added on <time datetime={item.created}>{formatDate(item.created)}</time></span>
            {#if item.hasBody}
              <a href={item.localUrl}>See more →</a>
            {:else}
              <a href={item.url}>Go to page →</a>
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
                checked={item.reviewed}
                onchange={event => markAsRead(event, item.id)}
              >
            </label>
          </li>
          <li>
            <a
              href={item.localUrl}
              class="flex justify-between"
            >
              Edit <span class="size-4 icon-[ri--pencil-line]"></span>
            </a>
          </li>
          <li>
            <button
              class="flex justify-between text-error"
            >
              Delete <span class="size-4 icon-[ri--delete-bin-6-line]"></span>
            </button>
          </li>
        </ul>
      </details>
    </li>
  {/each}
</ul>
