# Wind Homepage Redesign

## Goal

Redesign the homepage as a minimal, dark desktop dashboard optimized for a 1440 × 900 viewport. The page must prioritize today's observed wind, keep the expected build immediately visible, and expose as much useful information as possible without creating visual clutter.

## Information hierarchy

1. Today's observed wind and its freshness state.
2. Expected wind build from the forecast model.
3. Marine hazards and outlook.
4. Data timestamps, sources, and the external live-camera link.

Observed, forecast, and marine information remain visibly distinct so forecast data cannot be mistaken for a live observation.

## Layout

Use 32-pixel outer padding and a compact masthead followed by an asymmetric two-column workspace with a 24-pixel gutter.

- The 824-pixel left column contains the dominant “Spit now” reading, stale or current status, average, gust, lull, direction, and the full observed-wind chart.
- The 528-pixel right column contains the “Expected build” summary and a compact 24-hour forecast grid.
- A shallow bottom band contains the marine outlook and hazard status, snapshot metadata, source links, and one “Open live cam on YouTube” button.

The full composition must fit within 1440 × 900 without page scrolling or clipped content.

## Visual direction

Use a near-black and charcoal monochromatic foundation with off-white primary text and muted gray supporting text. Cyan identifies observed wind. Amber and red are reserved for stale readings, cautions, and marine hazards.

Typography should be compact and highly legible. Measurements use a tabular mono face; headings and explanatory text use a restrained sans-serif. Large current-wind numerals provide the primary focal point.

Use subtle separators and minimal borders. Avoid decorative gradients, heavy shadows, excessive rounded containers, and equal-weight card grids. Corners should be restrained and close to square.

## Content behavior

- Preserve all existing observed metrics and the observed chart.
- Preserve the model-current summary and all 24 hourly forecast values.
- Keep stale-data messaging adjacent to the current reading.
- Keep the marine forecast and warning state visible in the bottom band.
- Replace the embedded webcam section with a single external YouTube button and a short source label.
- Keep source links and the snapshot timestamp visible but visually subordinate.

## Validation checklist

- The 1440 × 900 frame is not collapsed, broken, or clipped.
- Today's observed wind is the unmistakable dominant region.
- Expected build is visible without scrolling.
- Observed, forecast, and marine layers cannot be confused.
- All text and status colors meet sufficient contrast.
- Measurements align consistently and remain readable.
- The YouTube section is represented only by an external-action button.
