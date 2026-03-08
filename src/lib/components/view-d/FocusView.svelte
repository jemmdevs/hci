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

	$effect(() => {
		if (fromExpose) {
			const timer = setTimeout(() => {
				fromExpose = false;
			}, 500);
			return () => clearTimeout(timer);
		}
	});

	// Track sidebar clicks to drive {#key} transitions.
	// Initialized at component mount — persists across {#key} remounts (same instance).
	let prevSidebarKey = store.sidebarClickKey;

	function focusIn(_node: Element): TransitionConfig {
		const isSidebarClick = store.sidebarClickKey !== prevSidebarKey;
		if (isSidebarClick) {
			prevSidebarKey = store.sidebarClickKey;
			// Elegant materialisation from the sidebar icon — subtle scale + opacity
			return {
				duration: 380,
				css: (t) => {
					const ease = 1 - Math.pow(1 - t, 3);
					const scale = 0.92 + 0.08 * ease;
					return `transform: scale(${scale}); opacity: ${ease}`;
				}
			};
		}

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

		// Default first entry
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
		// When focusedImage is still non-null, we're swapping (sidebar click replaced image).
		// Use a quick cross-fade instead of the dramatic scale-down.
		if (focusedImage !== null) {
			return {
				duration: 180,
				css: (t) => `opacity: ${t}; transform: scale(${0.97 + 0.03 * t})`
			};
		}
		// Genuine exit — image was dragged out or center cleared
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
	{#key store.sidebarClickKey}
		<div
			class="focus-view"
			class:dragging={isDragged}
			in:focusIn
			out:focusOut
			use:draggable={{ store, imageId: focusedImage.id }}
		>
			<img src={focusedImage.src} alt={focusedImage.alt} draggable="false" />
		</div>
	{/key}
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

	@media (max-width: 767px) {
		.focus-view {
			inset: 20px;
		}
	}
</style>
