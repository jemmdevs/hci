export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function pointInRect(px: number, py: number, rect: Rect): boolean {
	return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}
