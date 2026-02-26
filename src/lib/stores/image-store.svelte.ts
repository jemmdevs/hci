import type { ImageItem, ZoneId, CenterPosition } from '../types/image.js';
import type { DragState } from '../types/drag.js';
import type { Rect } from '../utils/geometry.js';
import type { ZoneRects } from '../utils/zone-detection.js';
import { defaultDragState } from '../types/drag.js';
import { detectZone } from '../utils/zone-detection.js';

const DEFAULT_PANEL_WIDTH = 320;
const DEFAULT_PANEL_HEIGHT = 240;

export class ImageStore {
	images: ImageItem[] = $state([]);
	dragState: DragState = $state({ ...defaultDragState });
	centerRect: Rect | null = $state(null);
	zoneRects: ZoneRects | null = $state(null);

	private nextZIndex = 1;

	constructor(initial: ImageItem[]) {
		this.images = initial;
		const maxZ = initial.reduce(
			(max, img) => Math.max(max, img.centerPosition?.zIndex ?? 0),
			0
		);
		this.nextZIndex = maxZ + 1;
	}

	leftSidebarImages = $derived.by(() =>
		this.images
			.filter((img) => img.zone === 'left-sidebar')
			.sort((a, b) => a.sidebarIndex - b.sidebarIndex)
	);

	rightSidebarImages = $derived.by(() =>
		this.images
			.filter((img) => img.zone === 'right-sidebar')
			.sort((a, b) => a.sidebarIndex - b.sidebarIndex)
	);

	centerImages = $derived.by(() =>
		this.images
			.filter((img) => img.zone === 'center')
			.sort((a, b) => (a.centerPosition?.zIndex ?? 0) - (b.centerPosition?.zIndex ?? 0))
	);

	draggedImage = $derived.by(() => {
		if (!this.dragState.active || !this.dragState.imageId) return null;
		return this.images.find((img) => img.id === this.dragState.imageId) ?? null;
	});

	moveToZone(imageId: string, targetZone: ZoneId, centerX?: number, centerY?: number) {
		const idx = this.images.findIndex((img) => img.id === imageId);
		if (idx === -1) return;

		const image = this.images[idx];

		if (targetZone === 'center') {
			const stagger = this.centerImages.length * 30;
			const x = centerX ?? 40 + stagger;
			const y = centerY ?? 40 + stagger;
			this.images[idx] = {
				...image,
				zone: 'center',
				sidebarIndex: -1,
				centerPosition: {
					x,
					y,
					width: DEFAULT_PANEL_WIDTH,
					height: DEFAULT_PANEL_HEIGHT,
					zIndex: this.nextZIndex++
				}
			};
		} else {
			const sidebarImages = this.images.filter(
				(img) => img.zone === targetZone && img.id !== imageId
			);
			this.images[idx] = {
				...image,
				zone: targetZone,
				sidebarIndex: sidebarImages.length,
				centerPosition: null
			};
		}

		this.reindexSidebar(image.zone);
	}

	updateCenterPosition(imageId: string, partial: Partial<CenterPosition>) {
		const idx = this.images.findIndex((img) => img.id === imageId);
		if (idx === -1 || !this.images[idx].centerPosition) return;

		this.images[idx] = {
			...this.images[idx],
			centerPosition: {
				...this.images[idx].centerPosition!,
				...partial
			}
		};
	}

	bringToFront(imageId: string) {
		const idx = this.images.findIndex((img) => img.id === imageId);
		if (idx === -1 || !this.images[idx].centerPosition) return;

		this.images[idx] = {
			...this.images[idx],
			centerPosition: {
				...this.images[idx].centerPosition!,
				zIndex: this.nextZIndex++
			}
		};
	}

	startDrag(imageId: string, pointerX: number, pointerY: number, offsetX: number, offsetY: number) {
		const image = this.images.find((img) => img.id === imageId);
		if (!image) return;

		// Compute hovered zone synchronously
		const hoveredZone = this.zoneRects
			? detectZone(pointerX, pointerY, this.zoneRects)
			: image.zone;

		this.dragState = {
			active: true,
			imageId,
			pointerX,
			pointerY,
			offsetX,
			offsetY,
			hoveredZone,
			sourceZone: image.zone
		};
	}

	updateDrag(pointerX: number, pointerY: number) {
		this.dragState.pointerX = pointerX;
		this.dragState.pointerY = pointerY;

		// Compute hovered zone synchronously on every move
		if (this.zoneRects) {
			this.dragState.hoveredZone = detectZone(pointerX, pointerY, this.zoneRects);
		}
	}

	setHoveredZone(zone: ZoneId | null) {
		this.dragState.hoveredZone = zone;
	}

	/** Convert viewport coords to center-relative coords */
	private toCenterRelative(viewportX: number, viewportY: number): { x: number; y: number } {
		const cx = this.centerRect?.x ?? 0;
		const cy = this.centerRect?.y ?? 0;
		return { x: viewportX - cx, y: viewportY - cy };
	}

	commitDrop() {
		if (!this.dragState.active || !this.dragState.imageId) {
			this.cancelDrag();
			return;
		}

		const { imageId, pointerX, pointerY, offsetX, offsetY, sourceZone } = this.dragState;

		// Final zone detection - synchronous, using latest pointer position
		const hoveredZone = this.zoneRects
			? detectZone(pointerX, pointerY, this.zoneRects)
			: this.dragState.hoveredZone;

		if (hoveredZone === 'center') {
			if (sourceZone === 'center') {
				const rel = this.toCenterRelative(pointerX - offsetX, pointerY - offsetY);
				this.updateCenterPosition(imageId, { x: rel.x, y: rel.y });
			} else {
				const rel = this.toCenterRelative(
					pointerX - DEFAULT_PANEL_WIDTH / 2,
					pointerY - DEFAULT_PANEL_HEIGHT / 2
				);
				this.moveToZone(imageId, 'center', rel.x, rel.y);
			}
		} else if (hoveredZone && hoveredZone !== sourceZone) {
			this.moveToZone(imageId, hoveredZone);
		}

		this.cancelDrag();
	}

	cancelDrag() {
		this.dragState = { ...defaultDragState };
	}

	clampCenterPanels() {
		if (!this.centerRect) return;
		const cw = this.centerRect.width;
		const ch = this.centerRect.height;
		for (let i = 0; i < this.images.length; i++) {
			const img = this.images[i];
			if (img.zone !== 'center' || !img.centerPosition) continue;
			const p = img.centerPosition;
			const maxX = Math.max(0, cw - p.width);
			const maxY = Math.max(0, ch - p.height);
			const clampedX = Math.max(0, Math.min(p.x, maxX));
			const clampedY = Math.max(0, Math.min(p.y, maxY));
			if (clampedX !== p.x || clampedY !== p.y) {
				this.images[i] = {
					...img,
					centerPosition: { ...p, x: clampedX, y: clampedY }
				};
			}
		}
	}

	reindexSidebar(zone: ZoneId) {
		if (zone === 'center') return;
		let index = 0;
		for (let i = 0; i < this.images.length; i++) {
			if (this.images[i].zone === zone) {
				this.images[i] = { ...this.images[i], sidebarIndex: index++ };
			}
		}
	}
}
