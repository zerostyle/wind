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

  it("includes the first valid sample and skips a 14° wander", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 234 },
    ])

    expect(markers).toEqual([{ time: time(1), directionDegrees: 220 }])
  })

  it("adds a marker at a 15° shift", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 235 },
    ])

    expect(markers).toEqual([
      { time: time(1), directionDegrees: 220 },
      { time: time(2), directionDegrees: 235 },
    ])
  })

  it("treats 350° → 5° as a 15° shift", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 350 },
      { time: time(2), directionDegrees: 5 },
    ])

    expect(markers).toHaveLength(2)
    expect(markers[1]).toEqual({ time: time(2), directionDegrees: 5 })
  })

  it("skips a large shift that happens sooner than 20 minutes", () => {
    const markers = selectDirectionMarkers([
      { time: time(1), directionDegrees: 180 },
      { time: new Date(time(1).getTime() + 19 * 60 * 1000), directionDegrees: 90 },
    ])

    expect(markers).toEqual([{ time: time(1), directionDegrees: 180 }])
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
