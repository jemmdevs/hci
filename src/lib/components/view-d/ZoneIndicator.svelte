<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { ZoneRects } from '$lib/utils/zone-detection.js';

	let { store, zoneRects }: { store: ImageStore; zoneRects: ZoneRects | null } = $props();

	let drag = $derived(store.dragState);
	let hoveredZone = $derived(drag.hoveredZone);
	let showIndicator = $derived(drag.active && hoveredZone && hoveredZone !== drag.sourceZone);

	let rect = $derived.by(() => {
		if (!zoneRects || !hoveredZone) return null;
		return zoneRects[hoveredZone];
	});
</script>

{#if showIndicator && rect}
	<div
		class="zone-indicator"
		style="
			left: {rect.x}px;
			top: {rect.y}px;
			width: {rect.width}px;
			height: {rect.height}px;
		"
	></div>
{/if}

<style>
	.zone-indicator {
		position: fixed;
		pointer-events: none;
		z-index: 9999;
		border: 2px dashed rgba(60, 130, 240, 0.4);
		background: rgba(60, 130, 240, 0.04);
		border-radius: 8px;
		transition:
			left 0.15s ease,
			top 0.15s ease,
			width 0.15s ease,
			height 0.15s ease;
	}
</style>
