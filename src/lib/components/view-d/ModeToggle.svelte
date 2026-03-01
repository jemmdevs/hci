<script lang="ts">
	import type { ImageStore } from '$lib/stores/image-store.svelte.js';

	let { store }: { store: ImageStore } = $props();

	let visible = $derived(store.centerImages.length > 0 && !store.exposeActive);
	let canExpose = $derived(store.centerMode === 'focus' && store.centerImages.length > 0);
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
		{#if canExpose}
			<button
				class="toggle-btn expose-btn"
				onclick={() => store.openExpose()}
				aria-label="Show all images"
			>
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<rect x="0.5" y="0.5" width="5" height="5" rx="1" fill="currentColor" />
					<rect x="8.5" y="0.5" width="5" height="5" rx="1" fill="currentColor" />
					<rect x="0.5" y="8.5" width="5" height="5" rx="1" fill="currentColor" />
					<rect x="8.5" y="8.5" width="5" height="5" rx="1" fill="currentColor" />
				</svg>
			</button>
		{/if}
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

	.expose-btn {
		display: none;
		padding: 4px 8px;
	}

	.expose-btn svg {
		display: block;
	}

	@media (hover: none) {
		.expose-btn {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
</style>
