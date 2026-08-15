# Tide and Air Temp Conditions Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show live Spit air temperature and the next CHS high/low tide in a header strip without mixing those sources into observed wind or forecast.

**Architecture:** Parse optional `t` from the existing SWS payload onto samples. Fetch Squamish Inner `wlp-hilo` from IWLS in parallel with the other snapshot sources, classify extrema, and pick the next low and high after now. Render a three-cell server component under the header.

**Tech Stack:** Next.js App Router, existing `fetch` + `next.revalidate` pattern, vitest.

---

### File map

- Create: `lib/wind/tide.ts` — convert, classify, pick next, fetch IWLS
- Create: `lib/wind/tide.test.ts`
- Create: `lib/wind/fixtures/iwls-squamish-hilo.json`
- Create: `components/wind/conditions-strip.tsx`
- Modify: `lib/wind/types.ts` — `temperatureCelsius`, `TideExtremum`, `TideLayer`, snapshot `tide`
- Modify: `lib/wind/parse-sws.ts` — parse `t`
- Modify: `lib/wind/sources.ts` — copy temp onto latest; parallel tide fetch
- Modify: `lib/wind/format.ts` — decimal formatter for °C / ft
- Modify: `lib/wind/wind.test.ts` — temperature parse cases
- Modify: `components/wind/wind-dashboard.tsx` — strip + CHS source link

---

### Task 1: Parse optional SWS temperature

**Files:**
- Modify: `lib/wind/types.ts`
- Modify: `lib/wind/parse-sws.ts`
- Modify: `lib/wind/wind.test.ts`
- Modify: `lib/wind/sources.ts`

- [ ] **Step 1: Write the failing tests**

Add to `lib/wind/wind.test.ts` inside `describe("parseSwsPayload")`:

```ts
it("attaches temperatureCelsius when t is a valid number", () => {
  const samples = parseSwsPayload({
    dt: ["100", "200"],
    ws: ["10", "11"],
    wg: ["12", "13"],
    wl: ["8", "9"],
    wd: ["180", "190"],
    t: ["17.2", "16.8"],
  })

  expect(samples.map((sample) => sample.temperatureCelsius)).toEqual([
    17.2, 16.8,
  ])
})

it("omits temperatureCelsius when t is missing or invalid, without dropping the sample", () => {
  const samples = parseSwsPayload({
    dt: ["100", "200", "300"],
    ws: ["10", "11", "12"],
    wg: ["12", "13", "14"],
    wl: ["8", "9", "10"],
    wd: ["180", "190", "200"],
    t: ["17.2", "nope"],
  })

  expect(samples).toHaveLength(3)
  expect(samples[0]!.temperatureCelsius).toBe(17.2)
  expect(samples[1]!.temperatureCelsius).toBeUndefined()
  expect(samples[2]!.temperatureCelsius).toBeUndefined()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/wind/wind.test.ts`
Expected: FAIL — `temperatureCelsius` is not on `WindSample`

- [ ] **Step 3: Implement parse + types + latest copy**

Add `temperatureCelsius?: number` to `WindSample` and `WindReading`.

In `parseSwsPayload`, after building a valid wind sample:

```ts
const temperatureCelsius = Number(payload.t?.[index])
if (Number.isFinite(temperatureCelsius)) {
  samples.at(-1)!.temperatureCelsius = temperatureCelsius
}
```

In `buildObservationLayer`, copy `newest.temperatureCelsius` onto `latest`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/wind/wind.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/wind/types.ts lib/wind/parse-sws.ts lib/wind/sources.ts lib/wind/wind.test.ts
git commit -m "feat: parse optional Spit air temperature from SWS"
```

---

### Task 2: Classify IWLS extrema and pick next tide

**Files:**
- Create: `lib/wind/fixtures/iwls-squamish-hilo.json`
- Create: `lib/wind/tide.ts`
- Create: `lib/wind/tide.test.ts`
- Modify: `lib/wind/format.ts`
- Modify: `lib/wind/types.ts`

IWLS point shape:

```ts
type IwlsHiloPoint = {
  eventDate: string
  value: number
}
```

Fixture (real Squamish Inner `wlp-hilo` for 14–15 Aug 2026):

```json
[
  { "eventDate": "2026-08-14T02:46:00Z", "value": 4.739 },
  { "eventDate": "2026-08-14T08:32:00Z", "value": 2.771 },
  { "eventDate": "2026-08-14T13:42:00Z", "value": 4.122 },
  { "eventDate": "2026-08-14T20:19:00Z", "value": 1.04 },
  { "eventDate": "2026-08-15T03:13:00Z", "value": 4.724 },
  { "eventDate": "2026-08-15T09:20:00Z", "value": 2.412 },
  { "eventDate": "2026-08-15T14:42:00Z", "value": 3.966 },
  { "eventDate": "2026-08-15T20:59:00Z", "value": 1.494 }
]
```

- [ ] **Step 1: Write the failing tests**

`lib/wind/tide.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import fixture from "./fixtures/iwls-squamish-hilo.json"
import {
  classifyHiloPoints,
  metresToFeet,
  pickNextTide,
} from "./tide"

describe("metresToFeet", () => {
  it("converts metres to feet for one-decimal display", () => {
    expect(metresToFeet(1.04)).toBeCloseTo(3.412, 3)
    expect(metresToFeet(1.04).toFixed(1)).toBe("3.4")
    expect(metresToFeet(4.724).toFixed(1)).toBe("15.5")
  })
})

describe("pickNextTide", () => {
  const now = new Date("2026-08-14T21:00:00.000Z") // 2:00 pm PDT, after the 1:19 pm low

  it("returns the next low and next high after now", () => {
    const tide = pickNextTide(fixture, now, new Date("2026-08-14T21:01:00.000Z"))

    expect(tide.nextLow).toMatchObject({
      kind: "low",
      eventAt: "2026-08-15T09:20:00.000Z",
    })
    expect(tide.nextLow!.heightFeet.toFixed(1)).toBe("7.9")
    expect(tide.nextHigh).toMatchObject({
      kind: "high",
      eventAt: "2026-08-15T03:13:00.000Z",
    })
    expect(tide.nextHigh!.heightFeet.toFixed(1)).toBe("15.5")
  })

  it("ignores extrema that have already passed", () => {
    const classified = classifyHiloPoints(fixture)
    const passedLow = classified.find(
      (point) => point.eventAt === "2026-08-14T20:19:00.000Z"
    )
    expect(passedLow?.kind).toBe("low")
    expect(pickNextTide(fixture, now, now).nextLow?.eventAt).not.toBe(
      "2026-08-14T20:19:00.000Z"
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/wind/tide.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement tide helpers + types**

Add `TideExtremum` and `TideLayer` to `lib/wind/types.ts` exactly as in the spec.

`lib/wind/tide.ts` exports:

- `metresToFeet(metres: number): number` → `metres * 3.280839895`
- `classifyHiloPoints(points)` — sort by `eventDate`; interior vs endpoints per spec
- `pickNextTide(points, now, fetchedAt): TideLayer` — first future low and high
- `buildTideLayer` / `fetchTidePredictions` using station id `5cebf1de3d0f4a073c4bb94e`, series `wlp-hilo`, window now−6h to now+48h, `revalidate: 1800`

Add `formatFixed(value: number | undefined, digits = 1): string` to `lib/wind/format.ts` (same `—` behavior as `formatKnots`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/wind/tide.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/wind/tide.ts lib/wind/tide.test.ts lib/wind/fixtures/iwls-squamish-hilo.json lib/wind/types.ts lib/wind/format.ts
git commit -m "feat: pick next CHS high and low tide from IWLS predictions"
```

---

### Task 3: Wire tide into the snapshot

**Files:**
- Modify: `lib/wind/types.ts`
- Modify: `lib/wind/sources.ts`

- [ ] **Step 1: Add `tide` to `WindSnapshot` and fetch in parallel**

```ts
const [observation, forecast, marine, tide] = await Promise.all([
  fetchSwsObservation(now, reqdate),
  fetchOpenMeteoForecast(),
  fetchMarineHazard(),
  fetchTidePredictions(now),
])
```

`fetchTidePredictions` returns `SourceResult<TideLayer>`. A thrown request becomes `{ ok: false, error }`.

- [ ] **Step 2: Run the full unit suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add lib/wind/types.ts lib/wind/sources.ts lib/wind/tide.ts
git commit -m "feat: fetch CHS tide alongside wind snapshot sources"
```

---

### Task 4: Conditions strip UI

**Files:**
- Create: `components/wind/conditions-strip.tsx`
- Modify: `components/wind/wind-dashboard.tsx`

- [ ] **Step 1: Add `ConditionsStrip`**

Three cells: Air · Spit sensor (observed teal), Next low · CHS, Next high · CHS (marine gold). Use `formatFixed` and `formatVancouverTime`. If `!tide.ok` or both extrema are null, show `—` in both tide cells and the note “Tide unavailable”.

- [ ] **Step 2: Mount under the header**

Place the strip after `</header>`, before the observed/forecast grid. On `min-[1440px]` shrink the two 560px columns to `464px` so the 900px frame still fits. Add CHS to the sources line:

`https://www.tides.gc.ca/en/stations/07811`

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/wind/conditions-strip.tsx components/wind/wind-dashboard.tsx
git commit -m "feat: show air temp and next tide in a header conditions strip"
```

---

### Self-review

- Spec air temp → Task 1
- Spec CHS classify / convert / next extrema → Task 2
- Spec parallel snapshot + independent failure → Task 3
- Spec strip UI, colors, sources, 1440 fit → Task 4
- No live network in tests — fixture only
