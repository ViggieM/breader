<script lang="ts">
import { installPWA } from '$lib/stores/installPWA.svelte.js';
</script>

<nav aria-label="Main navigation">
  <details class="dropdown dropdown-end">
    <summary class="btn btn-ghost btn-square">
      <span class="icon-[hugeicons--menu-11]"></span>
    </summary>
    <ul class="menu dropdown-content rounded-box bg-base-100 z-1 w-52 shadow p-2 space-y-1">
      <li>
        <a href="/settings" class="flex justify-between">Settings <span class="icon-[ri--settings-3-line]"></span></a>
      </li>
      <li>
        <button
          class="btn btn-primary btn-sm"
          onclick={installPWA}
        >
          <span class="icon-[hugeicons--download-01]"></span>
          Install App
        </button>
      </li>
    </ul>
  </details>
</nav>
