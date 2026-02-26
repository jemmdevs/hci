# View D — Spatial Image Workspace

## What is this app?

A SvelteKit app that implements a spatial image management UI. Users can drag and drop images between three zones (left sidebar, center workspace, right sidebar) with two viewing modes in the center area.

The app lives at `/view-d`. The root `/` page is just a default SvelteKit welcome.

## Tech stack

- **SvelteKit** (Svelte 5 with runes: `$state`, `$derived`, `$effect`, `$props`)
- **Tailwind CSS v4** via `@tailwindcss/vite` (but components use scoped `<style>` blocks, not utility classes)
- **TypeScript** (strict mode)
- **Storybook** (configured but mostly boilerplate stories)
- **Playwright** for E2E tests
- Formatter: **Prettier** (tabs, single quotes, no trailing commas)
- Linter: **ESLint** flat config

## Commands

- `npm run dev` — dev server
- `npm run build && npm run preview` — production build
- `npm run check` — svelte-check type validation
- `npm run lint` / `npm run format` — lint & format
- `npm run test:e2e` — Playwright tests

## Architecture

### Layout

```
┌──────────┬──────────────────┬──────────┐
│  Left    │                  │  Right   │
│  Sidebar │   Center Space   │  Sidebar │
│  100px   │      1fr         │  100px   │
└──────────┴──────────────────┴──────────┘
```

3-column CSS grid, full viewport. Images start in sidebars and can be dragged to center (and back).

### Key files

```
src/
├── lib/
│   ├── types/
│   │   ├── image.ts              # ZoneId, CenterMode, CenterPosition, ImageItem
│   │   └── drag.ts               # DragState interface + defaults
│   ├── stores/
│   │   └── image-store.svelte.ts # ImageStore class (single source of truth)
│   ├── actions/
│   │   └── draggable.ts          # Svelte action for drag-and-drop
│   ├── utils/
│   │   ├── geometry.ts           # Rect, clamp, pointInRect
│   │   └── zone-detection.ts     # detectZone, measureElement
│   └── components/view-d/
│       ├── ViewD.svelte          # Root component — grid, zone measuring, Escape key
│       ├── CenterSpace.svelte    # Orchestrates center modes + wheel handler
│       ├── CenterPanel.svelte    # Draggable/resizable panel (Free mode)
│       ├── FocusView.svelte      # Full-area single image (Focus mode)
│       ├── ExposeView.svelte     # Thumbnail grid overlay (Mission Control style)
│       ├── ModeToggle.svelte     # Focus/Free segmented control
│       ├── Sidebar.svelte        # Left/right sidebar container
│       ├── SidebarCard.svelte    # 64x64 draggable thumbnail
│       ├── DragOverlay.svelte    # Floating preview during drag
│       └── ZoneIndicator.svelte  # Drop zone highlight
├── routes/
│   ├── +layout.svelte            # Imports layout.css, sets favicon
│   ├── +page.svelte              # Default SvelteKit page
│   ├── layout.css                # @import 'tailwindcss'
│   └── view-d/+page.svelte      # Initializes 6 images, renders ViewD
```

### State management

Single `ImageStore` class using Svelte 5 runes. No external state libraries.

**Core state:** `images[]`, `dragState`, `centerRect`, `zoneRects`, `centerMode`, `focusedImageId`, `exposeActive`

**Derived:** `leftSidebarImages`, `rightSidebarImages`, `centerImages` (sorted by zIndex), `focusedImage`, `draggedImage`

### Center modes

1. **Focus mode** (default) — One image fills the center with `object-fit: contain`. Scroll wheel on center with 2+ images triggers Expose view (accumulates |deltaY|, threshold 150, resets after 300ms idle).

2. **Free mode** — Floating draggable/resizable panels. Each panel has position, size, and z-index. Panels can be moved within center and resized from bottom-right corner.

3. **Expose view** (overlay in Focus mode) — CSS grid of thumbnails. Click thumbnail to focus it. Click "x" to send image to right sidebar. Click backdrop or Escape to close.

### Drag and drop

- `draggable.ts` action handles pointer events with 5px drag threshold
- Zone detection is synchronous on every pointer move
- `DragOverlay` follows pointer during drag (adapts size to target zone)
- `ZoneIndicator` highlights the target drop zone
- On drop: images move between zones, sidebar reindexing happens automatically

### Transitions

All transitions use pure scale (no opacity) with ease-out cubic curves:
- Panel in: scale 0→1 (400ms)
- Focus in: scale 0.85→1 (400ms)
- Expose thumbnails: staggered scale 0→1 (300ms, 50ms delay between each)

### Z-index hierarchy

- 50: ModeToggle
- 100: Expose backdrop
- 9999: ZoneIndicator
- 10000: DragOverlay

### Design conventions

- Border radius: 14px (sidebar cards), 12px (center panels, thumbnails)
- Shadows: layered, subtle (`rgba(0,0,0,0.08)` to `0.16`)
- Colors: white backgrounds, black with opacity for text/borders
- No emojis in code
- Min panel size: 180x140px
- Default panel size: 320x240px

## Static assets

6 test images in `static/`: `image1.avif` through `image6.avif`. Initial setup puts images 1-3 in left sidebar, 4-6 in right sidebar.
