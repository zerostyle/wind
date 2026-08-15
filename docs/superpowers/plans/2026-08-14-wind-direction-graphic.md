# Wind Direction Graphic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the observed Direction text with a compact FROM-labeled compass whose arrow points TO, and draw thinned flow arrows along the top of the observed chart.

**Architecture:** Put circular-angle and marker-thinning helpers next to `degreesToCompass`. A presentational SVG compass replaces the Direction metric. Chart samples carry `directionDegrees`; TanStack `vector` marks (0° = up, clockwise) render thinned arrows at the top of the 0–40 knot plot.

**Tech Stack:** Next.js App Router, TanStack Charts `vector` + tooltip items, vitest.

---

### File map

- Create: `lib/wind/format.test.ts` — helper tests
- Modify: `lib/wind/format.ts` — `normalizeDegrees`, `circularAngleDelta`, `flowHeadingDegrees`, `selectDirectionMarkers`
- Create: `components/wind/wind-direction-compass.tsx` — rose + arrow + label
- Modify: `components/wind/wind-dashboard.tsx` — compass in Direction slot; `Arrow = flow.` legend
- Modify: `app/page.tsx` — pass `directionDegrees` into chart samples
- Modify: `components/wind/observed-wind-chart.tsx` — `ChartSample.directionDegrees`, vector row, tooltip item

---

### Task 1: Direction helpers

**Files:**
- Create: `lib/wind/format.test.ts`
- Modify: `lib/wind/format.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/wind/format.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  circularAngleDelta,
  flowHeadingDegrees,
  selectDirectionMarkers,
} from "./format"

describe("circularAngleDelta", () => {
  it("uses the shortest arc, including wrap-around", () => {
    expect(circularAngleDelta(358, 3)).toBe(5)
    expect(circularAngleDelta(3, 358)).toBe(5)
    expect(circularAngleDelta(180, 180)).toBe(0)
    expect(circularAngleDelta(10, 350)).toBe(20)
  })
})

describe("flowHeadingDegrees", () => {
  it("points the arrow where the wind is going", () => {
    expect(flowHeadingDegrees(180)).toBe(0)
    expect(flowHeadingDegrees(0)).toBe(180)
    expect(flowHeadingDegrees(220)).toBe(40)
  })
})

describe("selectDirectionMarkers", () => {
  const time = (hour: number) => new Date(Date.UTC(2026, 7, 14, hour))

  it("includes the first valid sample and skips a 4° wander", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 224 },
    ])

    expect(markers).toEqual([{ time: time(1), directionDegrees: 220 }])
  })

  it("adds a marker at a 5° shift", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 225 },
    ])

    expect(markers).toEqual([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 225 },
    ])
  })

  it("treats 358° → 3° as a 5° shift", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 358 },
      { time: time(2), directionDegrees: 3 },
    ])

    expect(markers).toHaveLength(2)
    expect(markers[1]).toEqual({ time: time(2), directionDegrees: 3 })
  })

  it("skips missing and non-finite direction", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: Number.NaN },
      { time: time(2) },
      { time: time(3), directionDegrees: 180 },
      { time: time(4), directionDegrees: 184 },
    ])

    expect(markers).toEqual([{ time: time(3), directionDegrees: 180 }])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/wind/format.test.ts`

Expected: FAIL — `circularAngleDelta` is not exported from `./format`

- [ ] **Step 3: Implement the helpers**

Add to `lib/wind/format.ts` after `degreesToCompass`:

```ts
export type DirectionSample = {
  time: Date
  directionDegrees?: number
}

export type DirectionMarker = {
  time: Date
  directionDegrees: number
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

export function circularAngleDelta(a: number, b: number): number {
  const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b))
  return Math.min(raw, 360 - raw)
}

export function flowHeadingDegrees(fromDegrees: number): number {
  return normalizeDegrees(fromDegrees + 180)
}

export function selectDirectionMarkers(
  samples: readonly DirectionSample[],
  thresholdDegrees = 5
): DirectionMarker[] {
  const markers: DirectionMarker[] = []

  for (const sample of samples) {
    const degrees = sample.directionDegrees
    if (degrees === undefined || !Number.isFinite(degrees)) {
      continue
    }

    const last = markers.at(-1)
    if (
      last === undefined ||
      circularAngleDelta(last.directionDegrees, degrees) >= thresholdDegrees
    ) {
      markers.push({ time: sample.time, directionDegrees: degrees })
    }
  }

  return markers
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/wind/format.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/wind/format.ts lib/wind/format.test.ts
git commit -m "$(cat <<'EOF'
feat: thin observed wind direction markers by 5°

EOF
)"
```

---

### Task 2: Compass component

**Files:**
- Create: `components/wind/wind-direction-compass.tsx`

- [ ] **Step 1: Add the compass**

Create `components/wind/wind-direction-compass.tsx`:

```tsx
import { degreesToCompass, flowHeadingDegrees } from "@/lib/wind/format"

type WindDirectionCompassProps = {
  degrees?: number
}

export function WindDirectionCompass({ degrees }: WindDirectionCompassProps) {
  const hasDirection = degrees !== undefined && Number.isFinite(degrees)
  const rounded = hasDirection ? Math.round(degrees) : null
  const label = hasDirection
    ? `${degreesToCompass(degrees)} ${rounded}°`
    : "—"
  const rotation = hasDirection ? flowHeadingDegrees(degrees) : 0

  return (
    <div className="flex flex-col items-start gap-1">
      <svg
        viewBox="0 0 40 40"
        className="size-10 text-observed"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <line x1="20" y1="3" x2="20" y2="7" stroke="currentColor" strokeWidth="1" />
        <line
          x1="37"
          y1="20"
          x2="33"
          y2="20"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="20"
          y1="37"
          x2="20"
          y2="33"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="3"
          y1="20"
          x2="7"
          y2="20"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <text
          x="20"
          y="11"
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="5"
          fontWeight="600"
        >
          N
        </text>
        {hasDirection ? (
          <g transform={`rotate(${rotation} 20 20)`}>
            <path d="M20 6 L23.4 22.5 L20 19.6 L16.6 22.5 Z" fill="currentColor" />
          </g>
        ) : null}
      </svg>
      <span className="font-mono text-lg tabular-nums">{label}</span>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit`

Expected: PASS (no new errors from this file)

- [ ] **Step 3: Commit**

```bash
git add components/wind/wind-direction-compass.tsx
git commit -m "$(cat <<'EOF'
feat: add observed wind direction compass

EOF
)"
```

---

### Task 3: Mount the compass

**Files:**
- Modify: `components/wind/wind-dashboard.tsx`

- [ ] **Step 1: Swap the Direction text for the compass**

In `components/wind/wind-dashboard.tsx`:

1. Add the import:

```ts
import { WindDirectionCompass } from "@/components/wind/wind-direction-compass"
```

2. Remove the `direction` const (the block that builds `` `${degreesToCompass(...)} ...` ``). Keep the `degreesToCompass` import — the forecast panel still uses it.

3. Replace the Direction `dd` so the slot is:

```tsx
<div>
  <dt className="font-mono text-[8px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
    Direction
  </dt>
  <dd className="mt-1">
    <WindDirectionCompass degrees={reading?.directionDegrees} />
  </dd>
</div>
```

Leave the forecast current-direction text unchanged.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/wind/wind-dashboard.tsx
git commit -m "$(cat <<'EOF'
feat: show observed direction as a compass

EOF
)"
```

---

### Task 4: Chart arrows and tooltip

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/wind/observed-wind-chart.tsx`

- [ ] **Step 1: Pass direction into chart samples**

In `app/page.tsx`, add `directionDegrees` to the mapped samples:

```ts
const chartSamples = snapshot.observation.ok
  ? snapshot.observation.data.samples.map((sample) => ({
      time: sample.observedAt,
      averageKnots: sample.averageKnots,
      gustKnots: sample.gustKnots,
      lullKnots: sample.lullKnots,
      directionDegrees: sample.directionDegrees,
    }))
  : []
```

- [ ] **Step 2: Render thinned vectors and a direction tooltip row**

In `components/wind/observed-wind-chart.tsx`:

1. Import `vector` from `@tanstack/charts` (same import as `defineChart`, `lineY`, `areaY`).
2. Import helpers:

```ts
import {
  degreesToCompass,
  flowHeadingDegrees,
  selectDirectionMarkers,
} from "@/lib/wind/format"
```

3. Extend the sample type:

```ts
export type ChartSample = {
  time: Date
  averageKnots: number
  gustKnots: number
  lullKnots: number
  directionDegrees?: number
}
```

4. Inside `useMemo`, before `return defineChart`, build plot markers:

```ts
const directionMarks = selectDirectionMarkers(samples).map((marker) => ({
  time: marker.time,
  plotKnots: 38,
  rotate: flowHeadingDegrees(marker.directionDegrees),
}))
```

5. Add this mark after the average `lineY` (still inside `marks`):

```ts
vector(directionMarks, {
  id: "direction",
  x: "time",
  y: "plotKnots",
  rotate: "rotate",
  length: 14,
  stroke: observed,
  strokeWidth: 1.5,
  headLength: 6,
  headAngle: 40,
  anchor: "middle",
}),
```

6. Replace the bare `tooltip` with:

```ts
tooltip: {
  use: tooltip,
  items: [
    "x",
    "y",
    {
      id: "direction",
      label: "Direction",
      text: (point) => {
        const degrees = point.datum.directionDegrees
        if (degrees === undefined || !Number.isFinite(degrees)) {
          return undefined
        }

        return `${degreesToCompass(degrees)} ${Math.round(degrees)}°`
      },
    },
  ],
},
```

If `point.datum` is untyped, cast: `(point.datum as ChartSample).directionDegrees`.

`vector` rotation is clockwise degrees with zero pointing up, which matches `flowHeadingDegrees`. `plotKnots: 38` sits the row under the top of the existing 0–40 domain.

- [ ] **Step 3: Typecheck and unit tests**

Run: `npx tsc --noEmit && npx vitest run lib/wind/format.test.ts`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/wind/observed-wind-chart.tsx
git commit -m "$(cat <<'EOF'
feat: plot thinned wind-flow arrows on the observed chart

EOF
)"
```

---

### Task 5: Chart legend note

**Files:**
- Modify: `components/wind/wind-dashboard.tsx`

- [ ] **Step 1: Add the flow legend item**

In the existing Avg / Gust / Lull legend (`font-mono text-[8px]` row above the chart), append:

```tsx
<span className="inline-flex items-center gap-1.5">
  <span
    className="inline-block size-0 border-x-[3px] border-b-[5px] border-x-transparent border-b-observed"
    aria-hidden="true"
  />
  Arrow = flow
</span>
```

- [ ] **Step 2: Check the live dashboard**

Run: `npm run dev` if it is not already running. Open `http://localhost:3000/`.

Confirm:

- Direction slot is a cyan rose with N at the top and `SW 220°`-style label (or `—` if missing).
- A south / SW thermal points the needle up.
- Chart top row has a few cyan arrows, not one per sample.
- Hovering a sample still shows knots and, when present, Direction.
- Forecast direction is still text.
- 1440 × 900 layout does not overflow.

- [ ] **Step 3: Commit**

```bash
git add components/wind/wind-dashboard.tsx
git commit -m "$(cat <<'EOF'
feat: label observed chart arrows as flow

EOF
)"
```
