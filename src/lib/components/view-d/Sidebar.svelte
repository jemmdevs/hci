<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';
	import SidebarCard from './SidebarCard.svelte';
	import { flip } from 'svelte/animate';

	let { side, store }: { side: 'left' | 'right'; store: ImageStore } = $props();

	let images = $derived(side === 'left' ? store.leftSidebarImages : store.rightSidebarImages);

	function sidebarIn(_node: Element): TransitionConfig {
		return {
			duration: 350,
			css: (t) => {
				// Pure scale, no opacity — like iOS icon landing
				const ease = 1 - Math.pow(1 - t, 3);
				return `transform: scale(${ease})`;
			}
		};
	}

	function sidebarOut(_node: Element): TransitionConfig {
		return {
			duration: 200,
			css: (t) => {
				const ease = Math.pow(t, 2);
				return `transform: scale(${ease})`;
			}
		};
	}
</script>

<div class="sidebar">
	{#each images as image (image.id)}
		<div animate:flip={{ duration: 300 }} in:sidebarIn out:sidebarOut>
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
