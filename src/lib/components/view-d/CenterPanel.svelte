<script lang="ts">
	import type { ImageItem } from '$lib/types/image.js';
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';
	import { draggable } from '$lib/actions/draggable.js';

	const MIN_WIDTH = 180;
	const MIN_HEIGHT = 140;

	let { image, store }: { image: ImageItem; store: ImageStore } = $props();

	let pos = $derived(image.centerPosition!);
	let isDragged = $derived(store.dragState.active && store.dragState.imageId === image.id);

	let visualX = $derived.by(() => {
		if (isDragged && store.centerRect) {
			return store.dragState.pointerX - store.dragState.offsetX - store.centerRect.x;
		}
		return pos.x;
	});

	let visualY = $derived.by(() => {
		if (isDragged && store.centerRect) {
			return store.dragState.pointerY - store.dragState.offsetY - store.centerRect.y;
		}
		return pos.y;
	});

	function onPointerDownCapture() {
		store.bringToFront(image.id);
	}

	function panelIn(_node: Element): TransitionConfig {
		return {
			duration: 400,
			css: (t) => {
				// Pure scale from 0, ease-out cubic — like opening an app on iOS
				const ease = 1 - Math.pow(1 - t, 3);
				return `transform: translate(${visualX}px, ${visualY}px) scale(${ease})`;
			}
		};
	}

	function panelOut(_node: Element): TransitionConfig {
		return {
			duration: 200,
			css: (t) => {
				const ease = Math.pow(t, 2);
				return `transform: translate(${visualX}px, ${visualY}px) scale(${ease})`;
			}
		};
	}

	// Resize logic
	let resizing = $state(false);
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartW = 0;
	let resizeStartH = 0;

	function onResizePointerDown(e: PointerEvent) {
		e.stopPropagation();
		e.preventDefault();
		resizing = true;
		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeStartW = pos.width;
		resizeStartH = pos.height;
		store.bringToFront(image.id);
		document.body.style.cursor = 'nwse-resize';

		window.addEventListener('pointermove', onResizePointerMove);
		window.addEventListener('pointerup', onResizePointerUp);
	}

	function onResizePointerMove(e: PointerEvent) {
		if (!resizing) return;
		e.preventDefault();
		const dx = e.clientX - resizeStartX;
		const dy = e.clientY - resizeStartY;
		const newW = Math.max(MIN_WIDTH, resizeStartW + dx);
		const newH = Math.max(MIN_HEIGHT, resizeStartH + dy);
		store.updateCenterPosition(image.id, { width: newW, height: newH });
	}

	function onResizePointerUp() {
		if (!resizing) return;
		resizing = false;
		document.body.style.cursor = '';
		window.removeEventListener('pointermove', onResizePointerMove);
		window.removeEventListener('pointerup', onResizePointerUp);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="center-panel"
	class:dragging={isDragged}
	class:resizing
	style="transform: translate({visualX}px, {visualY}px); width: {pos.width}px; height: {pos.height}px; z-index: {pos.zIndex};"
	use:draggable={{ store, imageId: image.id, enabled: !resizing, onpointerdown: onPointerDownCapture }}
	in:panelIn
	out:panelOut
>
	<img src={image.src} alt={image.alt} draggable="false" />
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resize-handle" data-no-drag onpointerdown={onResizePointerDown}></div>
</div>

<style>
	.center-panel {
		position: absolute;
		top: 0;
		left: 0;
		will-change: transform;
		border-radius: 12px;
		overflow: hidden;
		background: #ffffff;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
		cursor: grab;
		user-select: none;
		touch-action: none;
		display: flex;
		flex-direction: column;
		transition: box-shadow 0.2s ease;
	}

	.center-panel:hover {
		box-shadow: 0 6px 28px rgba(0, 0, 0, 0.16);
	}

	.center-panel.dragging {
		opacity: 0;
		cursor: grabbing;
		pointer-events: none;
	}

	.center-panel.resizing {
		box-shadow:
			0 0 0 2px rgba(0, 122, 255, 0.3),
			0 4px 20px rgba(0, 0, 0, 0.12);
	}

	.center-panel img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.resize-handle {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 24px;
		height: 24px;
		cursor: nwse-resize;
		touch-action: none;
	}

	.resize-handle::after {
		content: '';
		position: absolute;
		bottom: 4px;
		right: 4px;
		width: 12px;
		height: 12px;
		opacity: 0;
		transition: opacity 0.2s ease;
		clip-path: polygon(100% 0%, 100% 100%, 0% 100%);
		background: repeating-linear-gradient(
			135deg,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.25) 3px,
			rgba(0, 0, 0, 0.25) 4px
		);
	}

	.center-panel:hover .resize-handle::after {
		opacity: 1;
	}

	.resize-handle:hover::after {
		background: repeating-linear-gradient(
			135deg,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.4) 3px,
			rgba(0, 0, 0, 0.4) 4px
		);
	}

	.center-panel.resizing .resize-handle::after {
		opacity: 1;
		background: repeating-linear-gradient(
			135deg,
			transparent 0px,
			transparent 3px,
			rgba(0, 122, 255, 0.5) 3px,
			rgba(0, 122, 255, 0.5) 4px
		);
	}

	@media (pointer: coarse) {
		.resize-handle {
			width: 40px;
			height: 40px;
		}

		.resize-handle::after {
			width: 14px;
			height: 14px;
			bottom: 5px;
			right: 5px;
			opacity: 0.6;
		}
	}

	@media (hover: none) {
		.center-panel:hover {
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
		}

		.resize-handle::after {
			opacity: 0.6;
		}
	}
</style>
