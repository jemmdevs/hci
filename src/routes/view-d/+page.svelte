<script lang="ts">
	import { createInitialImages } from '$lib/data/images.js';
	import ViewD from '$lib/components/view-d/ViewD.svelte';

	const initialImages = createInitialImages();
</script>

<ViewD {initialImages} />
