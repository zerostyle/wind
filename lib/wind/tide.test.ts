import { describe, expect, it } from "vitest"
import fixture from "./fixtures/iwls-squamish-hilo.json"
import { classifyHiloPoints, metresToFeet, pickNextTide } from "./tide"

describe("metresToFeet", () => {
  it("converts metres to feet for one-decimal display", () => {
    expect(metresToFeet(1.04)).toBeCloseTo(3.412, 3)
    expect(metresToFeet(1.04).toFixed(1)).toBe("3.4")
    expect(metresToFeet(4.724).toFixed(1)).toBe("15.5")
  })
})

describe("pickNextTide", () => {
  const now = new Date("2026-08-14T21:00:00.000Z")

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
