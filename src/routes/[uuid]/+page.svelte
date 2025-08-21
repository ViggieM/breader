<script lang="ts">
import type { Bookmark } from '$lib/types';

const { data } = $props();
const bookmark: Bookmark = data.bookmark;

// Listen for navigation messages from service worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.action === 'navigate' && event.data?.url) {
      window.location.href = event.data.url;
    }
  });
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openUrl() {
  window.open(bookmark.url, '_blank');
}
</script>

<svelte:head>
  <title>{bookmark.title} - Breader</title>
</svelte:head>

<main class="container">
  <header>
    <div class="bookmark-header">
      <img src={bookmark.faviconUrl} alt="Favicon" class="favicon" />
      <h1>{bookmark.title}</h1>
      {#if bookmark.starred}
        <span class="star">⭐</span>
      {/if}
    </div>
  </header>

    <div class="bookmark-detail">
      <div class="url-section">
        <label>URL</label>
        <div class="url-container">
          <span class="url">{bookmark.url}</span>
          <button onclick={openUrl} class="open-btn">Open</button>
        </div>
      </div>

      {#if bookmark.description}
        <div class="section">
          <label>Description</label>
          <p class="description">{bookmark.description}</p>
        </div>
      {/if}

      {#if bookmark.tags.length > 0}
        <div class="section">
          <label>Tags</label>
          <div class="tags">
            {#each bookmark.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        </div>
      {/if}

      {#if bookmark.keywords.length > 0}
        <div class="section">
          <label>Keywords</label>
          <div class="keywords">
            {#each bookmark.keywords as keyword}
              <span class="keyword">{keyword}</span>
            {/each}
          </div>
        </div>
      {/if}

      <div class="meta-section">
        <div class="meta-item">
          <label>Created</label>
          <span>{formatDate(bookmark.created)}</span>
        </div>

        <div class="meta-item">
          <label>Modified</label>
          <span>{formatDate(bookmark.modified)}</span>
        </div>

        <div class="meta-item">
          <label>Status</label>
          <span class="status {bookmark.reviewed ? 'reviewed' : 'unreviewed'}">
            {bookmark.reviewed ? 'Reviewed' : 'Unreviewed'}
          </span>
        </div>
      </div>
    </div>
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
  }

  .back-link {
    color: #3b82f6;
    text-decoration: none;
    font-size: 0.9rem;
    display: inline-block;
    margin-bottom: 1rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .bookmark-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .favicon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .bookmark-header h1 {
    margin: 0;
    color: #1f2937;
    flex-grow: 1;
  }

  .star {
    font-size: 1.25rem;
  }

  .bookmark-detail {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .url-section, .section {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .url-container {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .url {
    flex-grow: 1;
    color: #3b82f6;
    word-break: break-all;
    font-family: monospace;
    font-size: 0.9rem;
  }

  .open-btn {
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .open-btn:hover {
    background: #2563eb;
  }

  .description {
    color: #4b5563;
    line-height: 1.6;
    margin: 0;
  }

  .tags, .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag, .keyword {
    padding: 0.25rem 0.75rem;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .keyword {
    background: #f0fdf4;
    color: #166534;
  }

  .meta-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .meta-item span {
    color: #4b5563;
    font-size: 0.9rem;
  }

  .status.reviewed {
    color: #059669;
    font-weight: 500;
  }

  .status.unreviewed {
    color: #d97706;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .container {
      padding: 0.5rem;
    }

    .bookmark-detail {
      padding: 1rem;
    }

    .url-container {
      flex-direction: column;
      align-items: stretch;
    }

    .meta-section {
      grid-template-columns: 1fr;
    }
  }
</style>
