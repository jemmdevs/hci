<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';

	let { store }: { store: ImageStore } = $props();

	let visible = $derived(store.centerImages.length > 0 && !store.exposeActive);
</script>

{#if visible}
	<div class="mode-toggle">
		<button
			class="toggle-btn"
			class:active={store.centerMode === 'focus'}
			onclick={() => store.setCenterMode('focus')}
		>
			Focus
		</button>
		<button
			class="toggle-btn"
			class:active={store.centerMode === 'free'}
			onclick={() => store.setCenterMode('free')}
		>
			Free
		</button>
	</div>
{/if}

<style>
	.mode-toggle {
		position: absolute;
		top: 12px;
		right: 12px;
		z-index: 50;
		display: flex;
		background: rgba(0, 0, 0, 0.06);
		border-radius: 8px;
		padding: 2px;
	}

	.toggle-btn {
		padding: 4px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: rgba(0, 0, 0, 0.5);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		line-height: 1.4;
	}

	.toggle-btn.active {
		background: #fff;
		color: rgba(0, 0, 0, 0.85);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toggle-btn:hover:not(.active) {
		color: rgba(0, 0, 0, 0.7);
	}
</style>
