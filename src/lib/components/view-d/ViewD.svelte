<script lang="ts">
	import type { ImageItem } from '$lib/types/image.js';
	import { ImageStore } from '$lib/stores/image-store.svelte.js';
	import { measureElement } from '$lib/utils/zone-detection.js';
	import Sidebar from './Sidebar.svelte';
	import CenterSpace from './CenterSpace.svelte';
	import DragOverlay from './DragOverlay.svelte';
	import ZoneIndicator from './ZoneIndicator.svelte';

	let { initialImages }: { initialImages: ImageItem[] } = $props();

	// eslint-disable-next-line svelte/valid-compile -- intentionally capture initial value once
	const store = new ImageStore(initialImages);

	let leftEl: HTMLElement | undefined = $state();
	let rightEl: HTMLElement | undefined = $state();
	let centerEl: HTMLElement | undefined = $state();

	function measureZones() {
		if (!leftEl || !rightEl || !centerEl) return;
		const centerMeasured = measureElement(centerEl);
		store.centerRect = centerMeasured;
		store.zoneRects = {
			'left-sidebar': measureElement(leftEl),
			'right-sidebar': measureElement(rightEl),
			center: centerMeasured
		};
	}

	// Measure on mount
	$effect(() => {
		if (leftEl && rightEl && centerEl) {
			measureZones();
		}
	});
</script>

<svelte:window
	onresize={() => {
		measureZones();
		store.clampCenterPanels();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			if (store.exposeActive) {
				store.closeExpose();
			} else if (store.dragState.active) {
				store.cancelDrag();
			}
		}
	}}
/>

<div class="view-d">
	<div class="zone zone-left" bind:this={leftEl}>
		<Sidebar side="left" {store} />
	</div>
	<div class="zone zone-center" bind:this={centerEl}>
		<CenterSpace {store} />
	</div>
	<div class="zone zone-right" bind:this={rightEl}>
		<Sidebar side="right" {store} />
	</div>
</div>

<DragOverlay {store} />
<ZoneIndicator {store} zoneRects={store.zoneRects} />

<style>
	.view-d {
		display: grid;
		grid-template-columns: 100px 1fr 100px;
		width: 100vw;
		height: 100vh;
		background: #ffffff;
		overflow: hidden;
	}

	.zone {
		height: 100%;
		overflow: hidden;
	}

	@media (max-width: 767px) {
		.view-d {
			grid-template-columns: 1fr;
			grid-template-rows: 72px 1fr 72px;
			height: 100dvh;
			padding-top: env(safe-area-inset-top);
			padding-bottom: env(safe-area-inset-bottom);
			padding-left: env(safe-area-inset-left);
			padding-right: env(safe-area-inset-right);
		}

		.zone {
			height: auto;
			width: 100%;
		}
	}
</style>
