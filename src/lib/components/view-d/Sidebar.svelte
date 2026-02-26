<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import SidebarCard from './SidebarCard.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	let { side, store }: { side: 'left' | 'right'; store: ImageStore } = $props();

	let images = $derived(side === 'left' ? store.leftSidebarImages : store.rightSidebarImages);

	let flyX = $derived(side === 'left' ? -40 : 40);
</script>

<div class="sidebar">
	{#each images as image (image.id)}
		<div animate:flip={{ duration: 250 }} in:fly={{ x: flyX, duration: 250 }} out:fly={{ x: flyX, duration: 200 }}>
			<SidebarCard {image} {store} />
		</div>
	{/each}
</div>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-evenly;
		padding: 0;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
	}
</style>
