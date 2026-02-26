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
		background: rgba(0, 0, 0, 0.03);
		border-radius: 0;
		animation: fade-in 0.2s ease;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
