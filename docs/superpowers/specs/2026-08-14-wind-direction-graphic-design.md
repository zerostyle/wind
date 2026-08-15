# Wind Direction Graphic

## Goal

Replace the observed Direction text with a compact compass, and show thinned direction arrows along the top of the observed chart. Match Squamish Windsports’ convention: the number is meteorological FROM; the arrow points TO (where the wind is going).

## In scope

- Observed current-direction compass in the existing Direction slot.
- Thinned direction arrows on the observed chart.
- Direction in the existing chart tooltip.
- Helpers to compute circular angle distance and select markers.

## Out of scope

- Forecast compass or hourly forecast direction marks.
- SWS-density arrows (one per sample).
- A “from/to” caption on the compass itself.
- Visual regression tests for the SVG.
- Changing `degreesToCompass`.

## Convention

Wind station degrees stay meteorological FROM. `180` is a south wind.

The graphic arrow points TO. A south wind (the usual Spit thermal) points up. `0` (north wind) points down.

Label copy stays `SW 220°` — compass point plus rounded FROM degrees. Do not add the word “from.”

## Compass

Replace the Direction `dd` text in the observed gust/lull/direction row.

- Compact rose, about 40px, N at the top, short E/S/W ticks.
- One observed-cyan arrow in the center, rotated to the TO heading.
- Label under the rose: `{compass} {degrees}°`, same type as today’s metric.
- Missing or non-finite `directionDegrees`: empty rose (ticks only, no arrow), label `—`.
- Forecast current direction stays text.

Rotation: draw the arrow pointing up (north). Rotate clockwise by `directionDegrees + 180`.

## Chart arrows

Keep arrows off the speed traces. Place a row of the same cyan arrowheads along the top of the observed plot.

`ChartSample` gains optional `directionDegrees`. `app/page.tsx` copies it from each observation sample.

### Thinning

`selectDirectionMarkers(samples, thresholdDegrees = 5)` returns `{ time, directionDegrees }[]`.

1. Skip samples with missing or non-finite direction.
2. Always include the first valid sample.
3. Include a later sample only when `circularAngleDelta(lastMarker, sample) >= 5`.
4. Do not force-include the latest sample if it has not moved 5°.

`circularAngleDelta` is the shortest distance on the circle: `358` → `3` is `5`. A 4° wander does not add a marker.

A steady SW thermal should produce a handful of arrows. A messy morning produces more. If the day has no valid direction, draw no arrows.

### Chart chrome

- Add `Arrow = flow.` to the existing Avg / Gust / Lull legend above the chart (dashboard-owned, not inside the plot).
- Existing tooltip still shows knots. If that sample has direction, also show e.g. `SW 220°`.
- Arrow rotation matches the compass (TO).

## Failure

- Observation missing: no compass reading, no arrows (same as today’s empty metrics).
- Some samples lack direction: skip those in thinning; compass uses the latest reading only.
- Archived observation days use that day’s latest reading and that day’s markers.

## Tests

No live network. Extend vitest around the new helpers:

- Wrap-around: `circularAngleDelta(358, 3) === 5`.
- `4`° from the last marker does not add; `5`° does.
- First valid sample is always included.
- Invalid or missing direction is skipped.

## Files

- `lib/wind/format.ts` — `circularAngleDelta`, `selectDirectionMarkers`
- `lib/wind/format.test.ts` — helper tests (or extend an existing format test file)
- `components/wind/wind-direction-compass.tsx` — rose + arrow + label
- `components/wind/observed-wind-chart.tsx` — `directionDegrees` on samples, top-row arrows, tooltip
- `components/wind/wind-dashboard.tsx` — compass in the Direction slot; `Arrow = flow.` in the chart legend
- `app/page.tsx` — pass `directionDegrees` into chart samples
