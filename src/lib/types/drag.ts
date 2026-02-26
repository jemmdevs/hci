import type { ZoneId } from './image.js';

export interface DragState {
	active: boolean;
	imageId: string | null;
	pointerX: number;
	pointerY: number;
	offsetX: number;
	offsetY: number;
	hoveredZone: ZoneId | null;
	sourceZone: ZoneId | null;
}

export const defaultDragState: DragState = {
	active: false,
	imageId: null,
	pointerX: 0,
	pointerY: 0,
	offsetX: 0,
	offsetY: 0,
	hoveredZone: null,
	sourceZone: null
};
