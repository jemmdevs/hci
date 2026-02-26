<script lang="ts">
	import type { ImageItem } from '$lib/types/image.js';
	import ViewD from '$lib/components/view-d/ViewD.svelte';

	const initialImages: ImageItem[] = [
		{
			id: 'img-1',
			src: '/image1.avif',
			alt: 'Image 1',
			zone: 'left-sidebar',
			sidebarIndex: 0,
			centerPosition: null
		},
		{
			id: 'img-2',
			src: '/image2.avif',
			alt: 'Image 2',
			zone: 'left-sidebar',
			sidebarIndex: 1,
			centerPosition: null
		},
		{
			id: 'img-3',
			src: '/image3.avif',
			alt: 'Image 3',
			zone: 'left-sidebar',
			sidebarIndex: 2,
			centerPosition: null
		},
		{
			id: 'img-4',
			src: '/image4.avif',
			alt: 'Image 4',
			zone: 'right-sidebar',
			sidebarIndex: 0,
			centerPosition: null
		},
		{
			id: 'img-5',
			src: '/image5.avif',
			alt: 'Image 5',
			zone: 'right-sidebar',
			sidebarIndex: 1,
			centerPosition: null
		},
		{
			id: 'img-6',
			src: '/image6.avif',
			alt: 'Image 6',
			zone: 'right-sidebar',
			sidebarIndex: 2,
			centerPosition: null
		}
	];
</script>

<ViewD {initialImages} />
