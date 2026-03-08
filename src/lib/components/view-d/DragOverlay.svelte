<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';

	let { store }: { store: ImageStore } = $props();

	let drag = $derived(store.dragState);
	let image = $derived(store.draggedImage);

	let isOverSidebar = $derived(
		drag.hoveredZone === 'left-sidebar' || drag.hoveredZone === 'right-sidebar'
	);

	let overlaySize = $derived(isOverSidebar ? 64 : 200);
	let overlayHeight = $derived(isOverSidebar ? 64 : 150);
	let radius = $derived(isOverSidebar ? 14 : 12);

	// Clamp so the overlay never goes more than half its size past the center zone boundary.
	// This prevents it from burying itself in the sidebar during drag.
	let tx = $derived.by(() => {
		const raw = drag.pointerX - overlaySize / 2;
		const cx = store.centerRect;
		if (!cx) return raw;
		const half = overlaySize / 2;
		return Math.max(cx.x - half, Math.min(raw, cx.x + cx.width - half));
	});

	let ty = $derived.by(() => {
		const raw = drag.pointerY - overlayHeight / 2;
		const cx = store.centerRect;
		if (!cx) return raw;
		const half = overlayHeight / 2;
		return Math.max(cx.y - half, Math.min(raw, cx.y + cx.height - half));
	});
</script>

{#if drag.active && image}
	<div
		class="drag-overlay"
		style="
			transform: translate({tx}px, {ty}px) scale(1.05);
			width: {overlaySize}px;
			height: {overlayHeight}px;
			border-radius: {radius}px;
		"
	>
		<img src={isOverSidebar ? image.thumb : image.src} alt={image.alt} draggable="false" />
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
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.18),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transition:
			width 0.25s cubic-bezier(0.2, 0, 0, 1),
			height 0.25s cubic-bezier(0.2, 0, 0, 1),
			border-radius 0.25s cubic-bezier(0.2, 0, 0, 1);
	}

	.drag-overlay img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (max-width: 767px) {
		.drag-overlay {
			max-width: 120px;
			max-height: 90px;
		}
	}
</style>
