# Tide and Air Temp Conditions Strip

## Goal

Add a live conditions strip under the homepage header: Spit air temperature plus the next low and next high tide after the current time. Keep observed wind, forecast, and marine hazards as separate sources.

## In scope

- Air temperature from the existing SWS `t` array, shown in °C.
- Next low and next high tide from CHS IWLS predictions for Squamish Inner, shown in feet with Vancouver local time.
- A three-cell strip under the header.
- Independent failure so a missing tide or temp never hides wind.

## Out of scope

- Full-day tide tables, interpolated “tide now” height, or countdowns.
- Scraping tide-forecast.com or any third-party tide API.
- Reconstructing historical tides when paging archived observation days.
- Staff duty status, sunrise/sunset, or other SWS widget extras.

## Data

### Air temperature

`SwsPayload.t` is already optional. Parse it in `parseSwsPayload` onto each `WindSample` as `temperatureCelsius?: number`. Copy the newest sample’s value onto `WindReading`. Invalid or missing entries are omitted, not zero.

### Tide

Use the official CHS Integrated Water Level System API.

- Station: Squamish Inner, code `07811`, IWLS id `5cebf1de3d0f4a073c4bb94e`
- Series: `wlp-hilo` (high and low predictions)
- Window: from 6 hours before now through 48 hours after now, UTC ISO timestamps
- Revalidate: 1800 seconds (predictions are stable)

Classify each interior extremum by comparing it to both neighbors: lower than both is a low; higher than both is a high. Endpoints compare to their one neighbor (lower → low, higher → high). With two points, the lower is low and the higher is high. Convert metres to feet with `metres * 3.280839895` and display one decimal.

`nextLow` is the first classified low with `eventAt > now`. `nextHigh` is the first classified high with `eventAt > now`. Tide is always computed from wall-clock now, including when the observation date nav shows an archived wind day.

### Snapshot

`getWindSnapshot` fetches observation, forecast, marine, and tide in parallel. Add `tide: SourceResult<TideLayer>` to `WindSnapshot`.

```ts
type TideExtremum = {
  kind: "low" | "high"
  eventAt: string
  heightFeet: number
}

type TideLayer = {
  source: "CHS Squamish Inner"
  stationCode: "07811"
  fetchedAt: string
  nextLow: TideExtremum | null
  nextHigh: TideExtremum | null
}
```

A thrown CHS request becomes `{ ok: false, error }`. Wind and marine still return.

## UI

A single card strip directly under the header, above the observed/forecast grid.

| Cell | Label | Color | Value |
| --- | --- | --- | --- |
| 1 | Air · Spit sensor | observed teal | `17.2` + `°C` |
| 2 | Next low · CHS | marine gold | `3.4` + `ft`, time under |
| 3 | Next high · CHS | marine gold | `15.5` + `ft`, time under |

Match existing mono labels, tabular numerals, and card background. Tide times use `formatVancouverTime` (Vancouver timezone, short date + hour:minute). Missing values render `—`, not an empty cell.

On narrow viewports the three cells wrap. On the 1440 × 900 frame the strip stays compact (~72–88px) so the existing columns can shrink slightly; do not reflow the page into scroll.

Add CHS to the existing sources line, linking to the Squamish Inner station page.

## Failure

- CHS down or unclassifiable series: both tide cells `—`, plus a one-line “Tide unavailable” note in the strip. Observation and forecast unchanged.
- Sensor omits `t`: temp cell `—`.
- Only one future extremum: show that one and `—` for the other.

## Tests

No live network in CI. Extend existing vitest coverage:

- `parseSwsPayload` keeps valid `t` values and skips invalid ones.
- Metres → feet rounding to one display decimal.
- Next low/high selection against a fixed `now` and a fixture of IWLS hilo points, including already-passed extrema.

## Files

- `lib/wind/types.ts` — `temperatureCelsius`, `TideLayer`, snapshot field
- `lib/wind/parse-sws.ts` — parse `t`
- `lib/wind/tide.ts` — fetch, classify, convert, pick next
- `lib/wind/tide.test.ts` — fixture-driven tide tests
- `lib/wind/sources.ts` — parallel tide fetch
- `components/wind/conditions-strip.tsx` — strip UI
- `components/wind/wind-dashboard.tsx` — mount strip, sources link
- `lib/wind/wind.test.ts` — temperature parse cases
