<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';
	import type { TransitionConfig } from 'svelte/transition';

	let { store }: { store: ImageStore } = $props();

	let centerImages = $derived(store.centerImages);

	let gridCols = $derived.by(() => {
		const count = centerImages.length;
		if (count <= 1) return 1;
		if (count <= 4) return 2;
		return 3;
	});

	function thumbnailIn(_node: Element, { index }: { index: number }): TransitionConfig {
		return {
			duration: 300,
			delay: index * 50,
			css: (t) => {
				const ease = 1 - Math.pow(1 - t, 3);
				return `transform: scale(${ease})`;
			}
		};
	}

	function thumbnailOut(_node: Element): TransitionConfig {
		return {
			duration: 150,
			css: (t) => {
				const ease = Math.pow(t, 2);
				return `transform: scale(${ease})`;
			}
		};
	}

	function onThumbnailClick(id: string) {
		store.setFocusedImage(id);
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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="expose-backdrop" onclick={onBackdropClick}>
	<div class="expose-grid" style="--cols: {gridCols}">
		{#each centerImages as image, index (image.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="thumbnail"
				class:focused={image.id === store.focusedImageId}
				onclick={() => onThumbnailClick(image.id)}
				in:thumbnailIn={{ index }}
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
		{/each}
	</div>
</div>

<style>
	.expose-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(245, 245, 245, 0.95);
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
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.thumbnail:hover {
		transform: scale(1.04);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.14);
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
</style>
