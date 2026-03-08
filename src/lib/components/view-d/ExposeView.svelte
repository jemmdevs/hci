<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { draggable } from '$lib/actions/draggable.js';

	let { store }: { store: ImageStore } = $props();

	let centerImages = $derived(store.centerImages);
	let gridEl: HTMLElement | undefined = $state();
	let localTargetIndex: number | null = $state(null);

	let isMobile = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => { isMobile = e.matches; };
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	let gridCols = $derived.by(() => {
		const count = centerImages.length;
		const maxCols = isMobile ? 2 : 3;
		if (count <= 1) return 1;
		if (count <= 4) return Math.min(2, maxCols);
		return maxCols;
	});

	let displayImages = $derived.by(() => {
		const images = centerImages;
		if (localTargetIndex === null) return images;

		const dragId = store.dragState.imageId;
		const currentIdx = images.findIndex((img) => img.id === dragId);
		if (currentIdx === -1 || currentIdx === localTargetIndex) return images;

		const result = images.slice();
		const [moved] = result.splice(currentIdx, 1);
		result.splice(localTargetIndex, 0, moved);
		return result;
	});

	$effect(() => {
		const active = store.dragState.active;
		const sourceZone = store.dragState.sourceZone;

		if (!active || sourceZone !== 'center' || !gridEl) {
			localTargetIndex = null;
			store.exposeDropTargetIndex = null;
			return;
		}

		const hoveredZone = store.dragState.hoveredZone;
		if (hoveredZone !== 'center') {
			localTargetIndex = null;
			store.exposeDropTargetIndex = null;
			return;
		}

		const px = store.dragState.pointerX;
		const py = store.dragState.pointerY;
		const gridRect = gridEl.getBoundingClientRect();
		const cols = gridCols;
		const count = centerImages.length;
		const gap = 20;
		const cellWidth = (gridRect.width - gap * (cols - 1)) / cols;
		const cellHeight = cellWidth * 0.75;

		const relX = px - gridRect.left;
		const relY = py - gridRect.top;

		const col = Math.max(0, Math.min(Math.floor((relX + gap / 2) / (cellWidth + gap)), cols - 1));
		const row = Math.max(0, Math.floor((relY + gap / 2) / (cellHeight + gap)));

		const idx = Math.max(0, Math.min(row * cols + col, count - 1));
		localTargetIndex = idx;
		store.exposeDropTargetIndex = idx;
	});

	function exposeIn(_node: Element): TransitionConfig {
		return {
			duration: 350,
			css: (t) => {
				const ease = 1 - Math.pow(1 - t, 3);
				return `opacity: ${ease}`;
			}
		};
	}

	function exposeOut(_node: Element): TransitionConfig {
		return {
			duration: 250,
			css: (t) => `opacity: ${t}`
		};
	}

	function gridIn(_node: Element): TransitionConfig {
		return {
			duration: 400,
			css: (t) => {
				const ease = 1 - Math.pow(1 - t, 3);
				const scale = 0.97 + 0.03 * ease;
				return `transform: scale(${scale})`;
			}
		};
	}

	function gridOut(_node: Element): TransitionConfig {
		return {
			duration: 200,
			css: (t) => {
				const scale = 0.97 + 0.03 * t;
				return `transform: scale(${scale})`;
			}
		};
	}

	// Individual thumbnail transitions (only used when removing a single item, not on initial appear)
	function thumbnailOut(_node: Element): TransitionConfig {
		return {
			duration: 200,
			css: (t) => {
				const ease = Math.pow(t, 2);
				return `transform: scale(${ease}); opacity: ${ease}`;
			}
		};
	}

	function onCloseClick(e: MouseEvent, id: string) {
		e.stopPropagation();
		store.closeFromExpose(id);
	}

	function onBackdropClick(e: MouseEvent) {
		if ((e.target as HTMLElement).classList.contains('expose-backdrop')) {
			store.closeExpose();
		}
	}

	function isDragged(id: string): boolean {
		return store.dragState.active && store.dragState.imageId === id;
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="expose-backdrop" in:exposeIn out:exposeOut onclick={onBackdropClick}>
	<div class="expose-grid" style="--cols: {gridCols}" in:gridIn out:gridOut bind:this={gridEl}>
		{#each displayImages as image (image.id)}
			<div animate:flip={{ duration: 400, easing: (t) => 1 - Math.pow(1 - t, 3) }}>
				<div
					class="thumbnail"
					class:focused={image.id === store.focusedImageId}
					class:dragging={isDragged(image.id)}
					use:draggable={{ store, imageId: image.id, onclick: () => store.setFocusedImage(image.id) }}
					out:thumbnailOut
				>
					<img src={image.src} alt={image.alt} draggable="false" />
					<button
						class="close-btn"
						onclick={(e) => onCloseClick(e, image.id)}
						aria-label="Remove from center"
					>
						&times;
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.expose-backdrop {
		position: absolute;
		inset: 0;
		background: #f5f5f5;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
	}

	.expose-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), 1fr);
		gap: 20px;
		max-width: 900px;
		width: 100%;
	}

	.thumbnail {
		position: relative;
		aspect-ratio: 4 / 3;
		border-radius: 12px;
		overflow: hidden;
		cursor: pointer;
		background: #fff;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		touch-action: none;
		user-select: none;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease,
			opacity 0.2s ease;
	}

	.thumbnail:hover {
		transform: scale(1.04);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
	}

	.thumbnail.dragging {
		opacity: 0;
		pointer-events: none;
	}

	.thumbnail.focused {
		outline: 3px solid rgba(0, 122, 255, 0.6);
		outline-offset: 2px;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.close-btn {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.5);
		color: #fff;
		font-size: 16px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.thumbnail:hover .close-btn {
		opacity: 1;
	}

	.close-btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	@media (max-width: 767px) {
		.expose-backdrop {
			padding: 20px;
		}

		.expose-grid {
			gap: 12px;
		}
	}

	@media (hover: none) {
		.close-btn {
			opacity: 1;
			width: 28px;
			height: 28px;
			font-size: 18px;
		}

		.thumbnail:hover {
			transform: none;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		}
	}
</style>
