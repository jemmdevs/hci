export type ZoneId = 'left-sidebar' | 'right-sidebar' | 'center';

export type CenterMode = 'focus' | 'free';

export interface CenterPosition {
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
}

export interface ImageItem {
	id: string;
	src: string;
	alt: string;
	zone: ZoneId;
	sidebarIndex: number;
	centerPosition: CenterPosition | null;
}
