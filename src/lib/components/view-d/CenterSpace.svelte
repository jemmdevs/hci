<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import CenterPanel from './CenterPanel.svelte';
	import FocusView from './FocusView.svelte';
	import ExposeView from './ExposeView.svelte';
	import ModeToggle from './ModeToggle.svelte';

	let { store }: { store: ImageStore } = $props();

	let centerImages = $derived(store.centerImages);

	// Scroll-wheel accumulator for exposé trigger
	let wheelAccum = 0;
	let wheelTimer: ReturnType<typeof setTimeout> | null = null;
	const WHEEL_THRESHOLD = 150;
	const WHEEL_IDLE_MS = 300;

	function onWheel(e: WheelEvent) {
		if (store.centerMode !== 'focus') return;
		if (store.exposeActive) return;
		if (centerImages.length < 2) return;

		wheelAccum += Math.abs(e.deltaY);

		if (wheelAccum >= WHEEL_THRESHOLD) {
			store.openExpose();
			wheelAccum = 0;
			if (wheelTimer) clearTimeout(wheelTimer);
			wheelTimer = null;
			return;
		}

		if (wheelTimer) clearTimeout(wheelTimer);
		wheelTimer = setTimeout(() => {
			wheelAccum = 0;
			wheelTimer = null;
		}, WHEEL_IDLE_MS);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="center-space" data-zone="center" onwheel={onWheel}>
	{#if centerImages.length === 0}
		<div class="empty-hint">
			<p>Drag images here</p>
		</div>
	{:else if store.centerMode === 'free'}
		{#each centerImages as image (image.id)}
			<CenterPanel {image} {store} />
		{/each}
	{:else}
		<FocusView {store} />
		{#if store.exposeActive}
			<ExposeView {store} />
		{/if}
	{/if}

	<ModeToggle {store} />
</div>

<style>
	.center-space {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.empty-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.empty-hint p {
		color: rgba(0, 0, 0, 0.2);
		font-size: 16px;
		font-weight: 400;
	}
</style>
