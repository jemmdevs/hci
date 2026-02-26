<script lang="ts">
	import type { ImageItem } from '$lib/types/image.js';
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import { draggable } from '$lib/actions/draggable.js';

	let { image, store }: { image: ImageItem; store: ImageStore } = $props();

	let isDragged = $derived(store.dragState.active && store.dragState.imageId === image.id);
</script>

<div
	class="app-icon"
	class:dragging={isDragged}
	use:draggable={{ store, imageId: image.id }}
	role="img"
	aria-label={image.alt}
>
	<img src={image.src} alt={image.alt} draggable="false" />
</div>

<style>
	.app-icon {
		width: 64px;
		height: 64px;
		border-radius: 14px;
		overflow: hidden;
		cursor: grab;
		user-select: none;
		touch-action: none;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
		flex-shrink: 0;
	}

	.app-icon:hover {
		transform: scale(1.08);
	}

	.app-icon:active {
		transform: scale(0.95);
	}

	.app-icon.dragging {
		opacity: 0;
		cursor: grabbing;
		pointer-events: none;
	}

	.app-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}
</style>
