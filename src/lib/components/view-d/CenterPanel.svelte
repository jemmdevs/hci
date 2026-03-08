<script lang="ts">
	import type { ImageItem } from '$lib/types/image.js';
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';
	import { draggable } from '$lib/actions/draggable.js';
	import { clamp } from '$lib/utils/geometry.js';

	const MIN_WIDTH = 180;
	const MIN_HEIGHT = 140;
	const EDGE_SIZE = 10;
	const SCROLL_SENSITIVITY = 0.001;

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

	// Transitions
	function panelIn(_node: Element): TransitionConfig {
		return {
			duration: 400,
			css: (t) => {
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

	// Edge detection
	type Edge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
	let hoveredEdge: Edge = $state(null);
	let isHovered = $state(false);
	let panelEl: HTMLElement | undefined = $state();

	function detectEdge(clientX: number, clientY: number, el: HTMLElement): Edge {
		const r = el.getBoundingClientRect();
		const x = clientX - r.left;
		const y = clientY - r.top;
		const T = EDGE_SIZE;
		const top = y < T;
		const bottom = y > r.height - T;
		const left = x < T;
		const right = x > r.width - T;
		if (top && left) return 'nw';
		if (top && right) return 'ne';
		if (bottom && left) return 'sw';
		if (bottom && right) return 'se';
		if (top) return 'n';
		if (bottom) return 's';
		if (left) return 'w';
		if (right) return 'e';
		return null;
	}

	function edgeCursor(edge: Edge): string {
		if (!edge) return 'grab';
		const map: Record<string, string> = {
			n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
			ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize'
		};
		return map[edge];
	}

	function onPanelPointerEnter() {
		isHovered = true;
	}

	function onPanelPointerMove(e: PointerEvent) {
		if (resizing || !panelEl) return;
		hoveredEdge = detectEdge(e.clientX, e.clientY, panelEl);
	}

	function onPanelPointerLeave() {
		if (!resizing) {
			hoveredEdge = null;
			isHovered = false;
		}
	}

	// Dynamic box-shadow: controlled fully in JS for smooth transitions
	let panelShadow = $derived.by(() => {
		const shadows: string[] = [];

		const baseShadow = isHovered
			? '0 6px 28px rgba(0,0,0,0.16)'
			: '0 4px 20px rgba(0,0,0,0.12)';
		shadows.push(baseShadow);

		if (hoveredEdge) {
			const c = 'rgba(0, 122, 255, 0.55)';
			if (hoveredEdge.includes('n')) shadows.push(`inset 0 2px 0 0 ${c}`);
			if (hoveredEdge.includes('s')) shadows.push(`inset 0 -2px 0 0 ${c}`);
			if (hoveredEdge.includes('e')) shadows.push(`inset -2px 0 0 0 ${c}`);
			if (hoveredEdge.includes('w')) shadows.push(`inset 2px 0 0 0 ${c}`);
		}

		return shadows.join(', ');
	});

	let panelStyle = $derived(
		`transform: translate(${visualX}px, ${visualY}px); width: ${pos.width}px; height: ${pos.height}px; z-index: ${pos.zIndex}; cursor: ${edgeCursor(hoveredEdge)}; box-shadow: ${panelShadow};`
	);

	// Edge resize
	let resizing = $state(false);
	let resizeEdge: Edge = null;
	let resizeStart = { x: 0, y: 0 };
	let resizeInitial = { x: 0, y: 0, width: 0, height: 0 };

	function onPanelPointerDown(e: PointerEvent) {
		if (!hoveredEdge) return;
		e.preventDefault();
		e.stopPropagation();
		store.bringToFront(image.id);
		resizing = true;
		resizeEdge = hoveredEdge;
		resizeStart = { x: e.clientX, y: e.clientY };
		resizeInitial = { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
		document.body.style.cursor = edgeCursor(resizeEdge);
		window.addEventListener('pointermove', onResizeMove);
		window.addEventListener('pointerup', onResizeUp);
	}

	function onResizeMove(e: PointerEvent) {
		if (!resizing || !resizeEdge) return;
		e.preventDefault();
		const dx = e.clientX - resizeStart.x;
		const dy = e.clientY - resizeStart.y;
		const { x, y, width, height } = resizeInitial;
		let newX = x, newY = y, newW = width, newH = height;

		if (resizeEdge.includes('e')) {
			newW = Math.max(MIN_WIDTH, width + dx);
		}
		if (resizeEdge.includes('w')) {
			newW = Math.max(MIN_WIDTH, width - dx);
			newX = x + width - newW;
		}
		if (resizeEdge.includes('s')) {
			newH = Math.max(MIN_HEIGHT, height + dy);
		}
		if (resizeEdge.includes('n')) {
			newH = Math.max(MIN_HEIGHT, height - dy);
			newY = y + height - newH;
		}

		store.updateCenterPosition(image.id, { x: newX, y: newY, width: newW, height: newH });
	}

	function onResizeUp() {
		if (!resizing) return;
		resizing = false;
		resizeEdge = null;
		document.body.style.cursor = '';
		window.removeEventListener('pointermove', onResizeMove);
		window.removeEventListener('pointerup', onResizeUp);
	}

	// Scroll to resize (proportional, anchored from center)
	function onPanelWheel(e: WheelEvent) {
		e.preventDefault();
		e.stopPropagation();
		const delta = e.deltaMode === 0 ? e.deltaY : e.deltaY * 30;
		const factor = clamp(1 - delta * SCROLL_SENSITIVITY, 0.85, 1.15);
		const newW = Math.max(MIN_WIDTH, pos.width * factor);
		const newH = Math.max(MIN_HEIGHT, pos.height * factor);
		const cx = pos.x + pos.width / 2;
		const cy = pos.y + pos.height / 2;
		store.updateCenterPosition(image.id, {
			x: cx - newW / 2,
			y: cy - newH / 2,
			width: newW,
			height: newH
		});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="center-panel"
	class:dragging={isDragged}
	class:resizing
	style={panelStyle}
	bind:this={panelEl}
	use:draggable={{
		store,
		imageId: image.id,
		enabled: !resizing && !hoveredEdge,
		onpointerdown: () => store.bringToFront(image.id)
	}}
	onpointerenter={onPanelPointerEnter}
	onpointermove={onPanelPointerMove}
	onpointerleave={onPanelPointerLeave}
	onpointerdown={onPanelPointerDown}
	onwheel={onPanelWheel}
	in:panelIn
	out:panelOut
>
	<img src={image.src} alt={image.alt} draggable="false" />
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
		user-select: none;
		touch-action: none;
		display: flex;
		flex-direction: column;
		transition: box-shadow 0.18s cubic-bezier(0.2, 0, 0, 1);
	}

	.center-panel.dragging {
		opacity: 0;
		cursor: grabbing;
		pointer-events: none;
	}

	.center-panel img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	@media (hover: none) {
		.center-panel img {
			pointer-events: none;
		}
	}
</style>
