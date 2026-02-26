<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';

	let { store }: { store: ImageStore } = $props();

	let drag = $derived(store.dragState);
	let image = $derived(store.draggedImage);

	let isOverSidebar = $derived(
		drag.hoveredZone === 'left-sidebar' || drag.hoveredZone === 'right-sidebar'
	);

	let overlaySize = $derived(isOverSidebar ? 64 : 200);

	let tx = $derived(drag.pointerX - overlaySize / 2);
	let ty = $derived(drag.pointerY - overlaySize / 2);
	let radius = $derived(isOverSidebar ? 14 : 12);
</script>

{#if drag.active && image}
	<div
		class="drag-overlay"
		style="
			transform: translate({tx}px, {ty}px);
			width: {overlaySize}px;
			height: {isOverSidebar ? overlaySize : overlaySize * 0.75}px;
			border-radius: {radius}px;
		"
	>
		<img src={image.src} alt={image.alt} draggable="false" />
	</div>
{/if}

<style>
	.drag-overlay {
		position: fixed;
		top: 0;
		left: 0;
		will-change: transform;
		pointer-events: none;
		z-index: 10000;
		overflow: hidden;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
		opacity: 0.9;
		transition:
			width 0.2s ease,
			height 0.2s ease,
			border-radius 0.2s ease;
	}

	.drag-overlay img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
