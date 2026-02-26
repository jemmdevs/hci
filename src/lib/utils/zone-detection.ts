import type { ZoneId } from '../types/image.js';
import type { Rect } from './geometry.js';
import { pointInRect } from './geometry.js';

export interface ZoneRects {
	'left-sidebar': Rect;
	'right-sidebar': Rect;
	center: Rect;
}

export function detectZone(px: number, py: number, zones: ZoneRects): ZoneId | null {
	if (pointInRect(px, py, zones['left-sidebar'])) return 'left-sidebar';
	if (pointInRect(px, py, zones['right-sidebar'])) return 'right-sidebar';
	if (pointInRect(px, py, zones.center)) return 'center';
	return null;
}

export function measureElement(el: HTMLElement): Rect {
	const r = el.getBoundingClientRect();
	return { x: r.left, y: r.top, width: r.width, height: r.height };
}
