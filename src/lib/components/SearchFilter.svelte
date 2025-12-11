<script lang="ts">
	import { filters } from '$lib/stores/search.svelte';
</script>

<details class="dropdown">
	<summary class="btn btn-sm btn-soft"
		><span class="ml-auto icon-[mi--filter]"></span> Filter</summary
	>
	<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
		<li>
			<label class="flex items-center text-sm cursor-pointer">
				<input
					type="checkbox"
					class="checkbox checkbox-sm mr-2"
					bind:checked={$filters.showUnread}
				/>
				Unreviewed
			</label>
		</li>
		<li>
			<label class="flex items-center text-sm cursor-pointer">
				<input
					type="checkbox"
					class="checkbox checkbox-sm mr-2"
					bind:checked={$filters.isStarred}
				/>
				Starred
			</label>
		</li>
	</ul>
</details>
