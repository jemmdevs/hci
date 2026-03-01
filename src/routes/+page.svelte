<script lang="ts">
	const views = [
		{
			letter: 'D',
			name: 'Spatial',
			description: 'Drag and drop system',
			color: '#e8ecf0',
			href: '/view-d',
			enabled: true
		}
	];
</script>

<div class="page">
	<header>
		<h1>Image Workspace</h1>
		<p>Explore spatial interactions</p>
	</header>

	<div class="grid">
		{#each views as view, i}
			{#if view.enabled}
				<a
					href={view.href}
					class="card"
					style="--bg: {view.color}; animation-delay: {i * 50}ms;"
				>
					<span class="letter">{view.letter}</span>
					<span class="name">{view.name}</span>
					<span class="desc">{view.description}</span>
				</a>
			{:else}
				<div
					class="card disabled"
					style="--bg: {view.color}; animation-delay: {i * 50}ms;"
				>
					<span class="letter">{view.letter}</span>
					<span class="name">{view.name}</span>
					<span class="desc">{view.description}</span>
				</div>
			{/if}
		{/each}
	</div>
</div>

<style>
	@keyframes card-in {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		box-sizing: border-box;
	}

	header {
		text-align: center;
		margin-bottom: 40px;
	}

	h1 {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.03em;
		color: #111;
		margin: 0 0 6px;
	}

	header p {
		font-size: 16px;
		color: #888;
		margin: 0;
		font-weight: 400;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 180px);
		gap: 16px;
		justify-content: center;
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 32px 16px;
		background: var(--bg);
		border-radius: 16px;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition:
			transform 250ms cubic-bezier(0.2, 0, 0, 1),
			box-shadow 250ms cubic-bezier(0.2, 0, 0, 1);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		animation: card-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: var(--delay, 0ms);
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.08),
			0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.card:active {
		transform: scale(0.97);
		transition-duration: 100ms;
	}

	@media (hover: none) {
		.card:hover {
			transform: none;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
		}
	}

	.card.disabled {
		opacity: 0.4;
		pointer-events: none;
		cursor: default;
	}

	.letter {
		font-size: 36px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #222;
		line-height: 1;
	}

	.name {
		font-size: 15px;
		font-weight: 600;
		color: #333;
		margin-top: 4px;
	}

	.desc {
		font-size: 12px;
		color: #999;
		text-align: center;
	}

	@media (max-width: 640px) {
		.page {
			justify-content: flex-start;
			padding: 40px 20px;
		}

		.grid {
			grid-template-columns: 1fr;
			width: 100%;
			max-width: 400px;
		}

		.card {
			flex-direction: row;
			justify-content: flex-start;
			gap: 12px;
			padding: 20px 24px;
		}

		.letter {
			font-size: 28px;
			min-width: 36px;
		}

		.name {
			margin-top: 0;
		}

		.desc {
			display: none;
		}
	}
</style>
