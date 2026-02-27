<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';
	import { draggable } from '$lib/actions/draggable.js';

	let { store }: { store: ImageStore } = $props();

	let focusedImage = $derived(store.focusedImage);
	let isDragged = $derived(
		focusedImage && store.dragState.active && store.dragState.imageId === focusedImage.id
	);

	// Track if we're returning from expose (subtle) vs first entry (bigger)
	let wasExposeActive = false;
	let fromExpose = $state(false);

	$effect(() => {
		const active = store.exposeActive;
		if (wasExposeActive && !active) {
			fromExpose = true;
		}
		wasExposeActive = active;
	});

	// Reset fromExpose after the transition would have played
	$effect(() => {
		if (fromExpose) {
			const timer = setTimeout(() => {
				fromExpose = false;
			}, 500);
			return () => clearTimeout(timer);
		}
	});

	function focusIn(_node: Element): TransitionConfig {
		if (fromExpose) {
			return {
				duration: 350,
				css: (t) => {
					const ease = 1 - Math.pow(1 - t, 3);
					const scale = 0.96 + 0.04 * ease;
					return `transform: scale(${scale})`;
				}
			};
		}
		return {
			duration: 500,
			css: (t) => {
				const ease = 1 - Math.pow(1 - t, 4);
				const scale = 0.5 + 0.5 * ease;
				return `transform: scale(${scale}); opacity: ${ease}`;
			}
		};
	}

	function focusOut(_node: Element): TransitionConfig {
		return {
			duration: 250,
			css: (t) => {
				const ease = Math.pow(t, 3);
				const scale = 0.5 + 0.5 * ease;
				return `transform: scale(${scale}); opacity: ${ease}`;
			}
		};
	}
</script>

{#if focusedImage}
	<div
		class="focus-view"
		class:dragging={isDragged}
		in:focusIn
		out:focusOut
		use:draggable={{ store, imageId: focusedImage.id }}
	>
		<img src={focusedImage.src} alt={focusedImage.alt} draggable="false" />
	</div>
{/if}

<style>
	.focus-view {
		position: absolute;
		inset: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: grab;
		user-select: none;
		touch-action: none;
		transition:
			transform 0.35s cubic-bezier(0.2, 0, 0, 1),
			opacity 0.35s cubic-bezier(0.2, 0, 0, 1);
	}

	.focus-view:active {
		transform: scale(0.97);
	}

	.focus-view.dragging {
		opacity: 0;
		transform: scale(0.9);
		cursor: grabbing;
		pointer-events: none;
	}

	.focus-view img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		pointer-events: none;
		border-radius: 12px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06);
	}
</style>
