import type { ImageItem, ZoneId, CenterPosition, CenterMode } from '../types/image.js';
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
	centerMode: CenterMode = $state('focus');
	focusedImageId: string | null = $state(null);
	exposeActive: boolean = $state(false);
	exposeDropTargetIndex: number | null = $state(null);

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

	focusedImage = $derived.by(() => {
		if (!this.focusedImageId) return null;
		return this.images.find((img) => img.id === this.focusedImageId && img.zone === 'center') ?? null;
	});

	setCenterMode(mode: CenterMode) {
		if (mode === this.centerMode) return;

		if (mode === 'focus') {
			// Pick the topmost z-index panel as focused
			const topImage = this.centerImages.at(-1);
			this.focusedImageId = topImage?.id ?? null;
			this.exposeActive = false;
		}

		this.centerMode = mode;
	}

	setFocusedImage(id: string | null) {
		this.focusedImageId = id;
		this.exposeActive = false;
	}

	openExpose() {
		if (this.centerMode !== 'focus' || this.centerImages.length === 0) return;
		this.exposeActive = true;
	}

	closeExpose() {
		this.exposeActive = false;
	}

	closeFromExpose(id: string) {
		this.moveToZone(id, 'right-sidebar');
		// If that was the focused image, pick another or clear
		if (this.focusedImageId === id) {
			const remaining = this.centerImages;
			this.focusedImageId = remaining.length > 0 ? remaining.at(-1)!.id : null;
		}
		// Close expose if 1 or fewer images remain
		if (this.centerImages.length <= 1) {
			this.exposeActive = false;
		}
	}

	reorderCenterImages(imageId: string, targetIndex: number) {
		const sorted = this.centerImages.slice();
		const currentIndex = sorted.findIndex((img) => img.id === imageId);
		if (currentIndex === -1 || currentIndex === targetIndex) return;

		const [moved] = sorted.splice(currentIndex, 1);
		sorted.splice(targetIndex, 0, moved);

		for (let i = 0; i < sorted.length; i++) {
			const idx = this.images.findIndex((img) => img.id === sorted[i].id);
			if (idx !== -1 && this.images[idx].centerPosition) {
				this.images[idx] = {
					...this.images[idx],
					centerPosition: {
						...this.images[idx].centerPosition!,
						zIndex: i + 1
					}
				};
			}
		}
		this.nextZIndex = sorted.length + 1;
	}

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

			if (this.centerMode === 'focus') {
				this.focusedImageId = imageId;
				this.exposeActive = false;
			}
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

			// If we moved the focused image out of center, pick another
			if (this.focusedImageId === imageId) {
				const remaining = this.centerImages;
				this.focusedImageId = remaining.length > 0 ? remaining.at(-1)!.id : null;
			}
			// Close expose if 1 or fewer center images remain
			if (this.exposeActive && this.centerImages.length <= 1) {
				this.exposeActive = false;
			}
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
			if (sourceZone === 'center' && this.exposeActive && this.exposeDropTargetIndex !== null) {
				this.reorderCenterImages(imageId, this.exposeDropTargetIndex);
				this.exposeDropTargetIndex = null;
			} else if (sourceZone === 'center') {
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
		} else if (
			hoveredZone === 'left-sidebar' || hoveredZone === 'right-sidebar'
		) {
			const targetIndex = this.getSidebarTargetIndex(hoveredZone, pointerX, pointerY);
			this.reorderInSidebar(imageId, hoveredZone, targetIndex);
		}

		this.cancelDrag();
	}

	cancelDrag() {
		this.dragState = { ...defaultDragState };
		this.exposeDropTargetIndex = null;
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

	reorderInSidebar(imageId: string, zone: 'left-sidebar' | 'right-sidebar', targetIndex: number) {
		const sorted = (zone === 'left-sidebar' ? this.leftSidebarImages : this.rightSidebarImages).slice();
		const currentIndex = sorted.findIndex((img) => img.id === imageId);
		if (currentIndex === -1 || currentIndex === targetIndex) return;

		const [moved] = sorted.splice(currentIndex, 1);
		sorted.splice(targetIndex, 0, moved);

		for (let i = 0; i < sorted.length; i++) {
			const idx = this.images.findIndex((img) => img.id === sorted[i].id);
			if (idx !== -1) {
				this.images[idx] = { ...this.images[idx], sidebarIndex: i };
			}
		}
	}

	getSidebarTargetIndex(zone: 'left-sidebar' | 'right-sidebar', pointerX: number, pointerY: number): number {
		if (!this.zoneRects) return 0;
		const rect = this.zoneRects[zone];
		const sidebarImages = zone === 'left-sidebar' ? this.leftSidebarImages : this.rightSidebarImages;
		const count = sidebarImages.length;
		if (count === 0) return 0;

		// Detect horizontal vs vertical sidebar from aspect ratio
		const isHorizontal = rect.width > rect.height;

		const rel = isHorizontal ? pointerX - rect.x : pointerY - rect.y;
		const extent = isHorizontal ? rect.width : rect.height;

		let closest = 0;
		let closestDist = Infinity;
		for (let i = 0; i < count; i++) {
			const itemCenter = ((i + 1) / (count + 1)) * extent;
			const dist = Math.abs(rel - itemCenter);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		}
		return closest;
	}
}
