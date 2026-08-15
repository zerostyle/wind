import { describe, expect, it } from "vitest"

import { getForecastTimeline } from "./forecast-timeline"
import type { ForecastHour } from "./types"

function hour(
  validAt: string,
  averageKnots: number,
  gustKnots: number
): ForecastHour {
  return {
    validAt,
    averageKnots,
    gustKnots,
    directionDegrees: 215,
  }
}

describe("getForecastTimeline", () => {
  it("returns the next nine forecast hours from the snapshot time", () => {
    const hours = [
      hour("2026-08-14T20:00:00.000Z", 4, 6),
      hour("2026-08-14T21:00:00.000Z", 8, 10),
      hour("2026-08-14T22:00:00.000Z", 8, 11),
      hour("2026-08-14T23:00:00.000Z", 10, 14),
      hour("2026-08-15T00:00:00.000Z", 10, 14),
      hour("2026-08-15T01:00:00.000Z", 2, 5),
      hour("2026-08-15T02:00:00.000Z", 4, 4),
      hour("2026-08-15T03:00:00.000Z", 1, 3),
      hour("2026-08-15T04:00:00.000Z", 3, 3),
      hour("2026-08-15T05:00:00.000Z", 3, 3),
      hour("2026-08-15T06:00:00.000Z", 2, 2),
    ]

    const timeline = getForecastTimeline(
      hours,
      "2026-08-14T20:39:00.000Z"
    )

    expect(timeline.hours).toHaveLength(9)
    expect(timeline.hours[0]?.validAt).toBe("2026-08-14T21:00:00.000Z")
    expect(timeline.hours.at(-1)?.validAt).toBe("2026-08-15T05:00:00.000Z")
  })

  it("describes the first consecutive period at the peak speed", () => {
    const hours = [
      hour("2026-08-14T21:00:00.000Z", 8, 10),
      hour("2026-08-14T22:00:00.000Z", 10, 13),
      hour("2026-08-14T23:00:00.000Z", 10, 14),
      hour("2026-08-15T00:00:00.000Z", 4, 6),
      hour("2026-08-15T01:00:00.000Z", 10, 12),
    ]

    const timeline = getForecastTimeline(
      hours,
      "2026-08-14T20:39:00.000Z"
    )

    expect(timeline.peak).toEqual({
      averageKnots: 10,
      gustKnots: 14,
      startAt: "2026-08-14T22:00:00.000Z",
      endAt: "2026-08-14T23:00:00.000Z",
    })
  })
})
