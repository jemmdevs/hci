import type { ImageItem } from '$lib/types/image.js';

export const IMAGE_SOURCES = [
	{ id: 'img-1', src: '/image1.avif', alt: 'Image 1' },
	{ id: 'img-2', src: '/image2.avif', alt: 'Image 2' },
	{ id: 'img-3', src: '/image3.avif', alt: 'Image 3' },
	{ id: 'img-4', src: '/image4.avif', alt: 'Image 4' },
	{ id: 'img-5', src: '/image5.avif', alt: 'Image 5' },
	{ id: 'img-6', src: '/image6.avif', alt: 'Image 6' }
] as const;

export function createInitialImages(): ImageItem[] {
	return IMAGE_SOURCES.map((img, i) => ({
		...img,
		zone: i < 3 ? ('left-sidebar' as const) : ('right-sidebar' as const),
		sidebarIndex: i < 3 ? i : i - 3,
		centerPosition: null
	}));
}
