<script lang="ts">
	import { List } from '$lib/types';

	const { data } = $props();
	let list: List = $state(data.list);
</script>

<h1>{list.name}</h1>
