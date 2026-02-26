<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';

	let { store }: { store: ImageStore } = $props();

	let focusedImage = $derived(store.focusedImage);

	function focusIn(_node: Element): TransitionConfig {
		return {
			duration: 400,
			css: (t) => {
				const ease = 1 - Math.pow(1 - t, 3);
				const scale = 0.85 + 0.15 * ease;
				return `transform: scale(${scale})`;
			}
		};
	}

	function focusOut(_node: Element): TransitionConfig {
		return {
			duration: 200,
			css: (t) => {
				const ease = Math.pow(t, 2);
				const scale = 0.85 + 0.15 * ease;
				return `transform: scale(${scale})`;
			}
		};
	}
</script>

{#if focusedImage}
	{#key store.focusedImageId}
		<div class="focus-view" in:focusIn out:focusOut>
			<img src={focusedImage.src} alt={focusedImage.alt} draggable="false" />
		</div>
	{/key}
{/if}

<style>
	.focus-view {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.focus-view img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}
</style>
