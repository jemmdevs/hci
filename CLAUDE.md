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
│       ├── FocusView.svelte      # Draggable focused image (Focus mode)
│       ├── ExposeView.svelte     # Draggable thumbnail grid overlay (Mission Control style)
│       ├── ModeToggle.svelte     # Focus/Free segmented control
│       ├── Sidebar.svelte        # Left/right sidebar container with flip animation
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

**Key methods:** `moveToZone`, `reorderInSidebar`, `getSidebarTargetIndex`, `closeFromExpose`, `commitDrop`, `bringToFront`, `updateCenterPosition`

### Center modes

1. **Focus mode** (default) — One image displayed with `inset: 40px` margin + `border-radius: 12px` on the `<img>` + subtle box-shadow. Image is draggable back to sidebars. No `{#key}` block — switching between focused images updates `src` reactively (no flash). Scroll wheel triggers Expose with 1+ images (threshold 150 deltaY, 300ms idle reset).

2. **Free mode** — Floating draggable/resizable panels. Each panel has position, size, and z-index. Panels can be moved within center and resized from bottom-right corner.

3. **Expose view** (overlay in Focus mode) — CSS grid of thumbnails with `animate:flip`. Thumbnails are draggable to sidebars. Click thumbnail to focus it. Click "x" to send to right sidebar. Click backdrop or Escape to close. Opaque `#f5f5f5` backdrop (not semi-transparent). Auto-closes when <=1 image remains (so removing 1 of 2 returns to focus).

### Drag and drop

- `draggable.ts` action handles pointer events with 5px drag threshold
- **Ignores interactive children**: `target.closest('button, a, [data-no-drag]')` check prevents drag from capturing button clicks (e.g. expose "x" close button)
- Zone detection is synchronous on every pointer move
- `DragOverlay` follows pointer during drag (adapts size to target zone)
- `ZoneIndicator` highlights the target drop zone
- On drop: images move between zones, sidebar reindexing happens automatically
- **Sidebar reordering**: dragging within the same sidebar reorders images by calculating target index from pointer Y position (based on `space-evenly` layout)
- **Focus mode drag**: focused image can be dragged to sidebars; when moved out, next center image becomes focused (or null if none left)
- **Expose drag**: thumbnails in expose can be dragged to sidebars

### Transitions (Apple-like style)

All animations aim for subtle, elegant, Apple-like feel:

- **Free panel in**: scale 0→1, 400ms cubic ease-out
- **Free panel out**: scale 1→0, 200ms quadratic ease-in
- **Focus in (first entry)**: scale 0.5→1 + opacity, 500ms quartic ease-out
- **Focus in (from expose)**: scale 0.96→1, 350ms cubic ease-out — very subtle
- **Focus out**: scale 1→0.5 + opacity, 250ms cubic ease-in
- **Focus drag state**: scale 0.9 + opacity 0, CSS transition 350ms `cubic-bezier(0.2, 0, 0, 1)`
- **Focus :active**: scale 0.97 (press feedback)
- **Expose backdrop in**: opacity fade, 350ms cubic ease-out
- **Expose grid in**: scale 0.97→1, 400ms cubic ease-out (whole grid as unit)
- **Expose grid out**: scale 1→0.97, 200ms
- **Expose thumbnail removal**: scale+opacity out 200ms, remaining items reflow with `animate:flip` 400ms cubic ease-out
- **Sidebar reorder**: `animate:flip` 300ms

### Z-index hierarchy

- 50: ModeToggle
- 100: Expose backdrop (opaque)
- 9999: ZoneIndicator
- 10000: DragOverlay

### Design conventions

- Border radius: 14px (sidebar cards), 12px (center panels, thumbnails, focused image)
- Shadows: layered, subtle (`rgba(0,0,0,0.06)` to `0.14`)
- Focus image shadow: `0 4px 24px rgba(0,0,0,0.1), 0 1px 8px rgba(0,0,0,0.06)`
- Colors: white backgrounds, `#f5f5f5` expose backdrop, black with opacity for text/borders
- No emojis in code
- Min panel size: 180x140px
- Default panel size: 320x240px
- Focus mode image: `inset: 40px`, `max-width/max-height: 100%`, `object-fit: contain`
- Easing curves: quartic ease-out for entrances, quadratic/cubic ease-in for exits, `cubic-bezier(0.2, 0, 0, 1)` for CSS transitions (Apple's curve)

## Static assets

6 test images in `static/`: `image1.avif` through `image6.avif`. Initial setup puts images 1-3 in left sidebar, 4-6 in right sidebar.

## Session history

### Session 1 (2026-02-26)
- Initial implementation of the full spatial workspace

### Session 2 (2026-02-27)
- Focus mode: image no longer fills entire center (40px inset margin, border-radius on `<img>` not container)
- Focus mode: image is now draggable back to sidebars
- Focus mode transitions: removed `{#key}` to eliminate flash on image switch; context-aware animations (subtle when returning from expose, bigger on first entry)
- Expose: works with 1+ images (was 2+), opaque backdrop (was semi-transparent), auto-closes when <=1 image remains
- Expose: thumbnails are draggable to sidebars; "x" close button works alongside drag (draggable ignores `button` targets)
- Expose: Apple-like entrance animation (backdrop fade + grid scale as unit), `animate:flip` for smooth reflow on removal
- Sidebar reordering: images can be reordered within the same sidebar by dragging vertically
- All animations refined for Apple-like subtlety (no harsh flashes, gentle easing curves)
