<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import CenterPanel from './CenterPanel.svelte';

	let { store }: { store: ImageStore } = $props();

	let centerImages = $derived(store.centerImages);
</script>

<div class="center-space" data-zone="center">
	{#each centerImages as image (image.id)}
		<CenterPanel {image} {store} />
	{/each}

	{#if centerImages.length === 0}
		<div class="empty-hint">
			<p>Drag images here</p>
		</div>
	{/if}
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
