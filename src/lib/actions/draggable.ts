import type { ImageStore } from '../stores/image-store.svelte.js';

const DRAG_THRESHOLD = 5;

export interface DraggableOptions {
	store: ImageStore;
	imageId: string;
	enabled?: boolean;
	onclick?: () => void;
	onpointerdown?: () => void;
}

export function draggable(node: HTMLElement, options: DraggableOptions) {
	let { store, imageId, enabled = true, onclick, onpointerdown } = options;

	let startX = 0;
	let startY = 0;
	let hasDragged = false;
	let active = false;

	function onPointerDown(e: PointerEvent) {
		if (!enabled || e.button !== 0 || active) return;
		// Ignore clicks on interactive children (buttons, links)
		const target = e.target as HTMLElement;
		if (target.closest('button, a, [data-no-drag]')) return;
		e.preventDefault();
		e.stopPropagation();

		onpointerdown?.();

		startX = e.clientX;
		startY = e.clientY;
		hasDragged = false;
		active = true;

		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	function onPointerMove(e: PointerEvent) {
		if (!active) return;

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (!hasDragged) {
			if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
			hasDragged = true;

			const rect = node.getBoundingClientRect();
			const offsetX = startX - rect.left;
			const offsetY = startY - rect.top;
			store.startDrag(imageId, e.clientX, e.clientY, offsetX, offsetY);
		} else {
			store.updateDrag(e.clientX, e.clientY);
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (!active) return;
		active = false;

		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);

		if (!hasDragged) {
			onclick?.();
		} else if (store.dragState.active) {
			store.commitDrop();
		}
	}

	node.addEventListener('pointerdown', onPointerDown);

	return {
		update(newOptions: DraggableOptions) {
			store = newOptions.store;
			imageId = newOptions.imageId;
			enabled = newOptions.enabled ?? true;
			onclick = newOptions.onclick;
			onpointerdown = newOptions.onpointerdown;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('pointerup', onPointerUp);
		}
	};
}
