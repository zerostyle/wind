import { describe, expect, it } from "vitest"
import fixture from "./fixtures/sws-spit-2026-08-14.json"
import { isStaleObservation, vancouverDateKey } from "./freshness"
import { getKiteHint } from "./kite-hint"
import { newestSample, parseSwsPayload } from "./parse-sws"
import { parseMarineHtml } from "./sources"
import type { MarineHazard, SwsPayload, WindReading } from "./types"

describe("parseSwsPayload", () => {
  it("zips parallel arrays into one sample per index", () => {
    const samples = parseSwsPayload(fixture as SwsPayload)

    expect(samples).toHaveLength(fixture.dt.length)
    expect(samples[0]).toMatchObject({
      averageKnots: Number(fixture.ws[0]),
      gustKnots: Number(fixture.wg[0]),
      lullKnots: Number(fixture.wl[0]),
      directionDegrees: Number(fixture.wd[0]),
    })
    expect(samples[0]!.observedAt.toISOString()).toBe(
      new Date(Number(fixture.dt[0]) * 1000).toISOString()
    )
  })

  it("uses the newest dt as observation time, not fetch time", () => {
    const samples = parseSwsPayload(fixture as SwsPayload)
    const newest = newestSample(samples)
    const lastUnix = Number(fixture.dt[fixture.dt.length - 1])

    expect(newest).not.toBeNull()
    expect(newest!.observedAt.getTime()).toBe(lastUnix * 1000)
    expect(newest!.averageKnots).toBe(Number(fixture.ws.at(-1)))
  })

  it("skips rows with invalid numbers", () => {
    const samples = parseSwsPayload({
      dt: ["100", "bad", "300"],
      ws: ["10", "11", "12"],
      wg: ["12", "13", "14"],
      wl: ["8", "9", "10"],
      wd: ["180", "190", "200"],
    })

    expect(samples).toHaveLength(2)
    expect(samples.map((s) => s.observedAt.getTime())).toEqual([
      100_000, 300_000,
    ])
  })
})

describe("isStaleObservation", () => {
  it("marks samples older than 20 minutes as stale", () => {
    const now = new Date("2026-08-14T21:00:00.000Z")
    const observedAt = new Date("2026-08-14T20:30:00.000Z")

    expect(isStaleObservation(observedAt, now)).toBe(true)
  })

  it("marks fresh same-day samples as not stale", () => {
    const now = new Date("2026-08-14T21:00:00.000Z")
    const observedAt = new Date("2026-08-14T20:50:00.000Z")

    expect(isStaleObservation(observedAt, now)).toBe(false)
  })

  it("marks yesterday samples as stale even if within 20 minutes wall clock", () => {
    // 23:55 PT Aug 13 vs 00:05 PT Aug 14 is 10 minutes apart but different calendar day
    const observedAt = new Date("2026-08-14T06:55:00.000Z") // Aug 13 23:55 PT (PDT)
    const now = new Date("2026-08-14T07:05:00.000Z") // Aug 14 00:05 PT

    expect(vancouverDateKey(observedAt)).not.toBe(vancouverDateKey(now))
    expect(isStaleObservation(observedAt, now)).toBe(true)
  })
})

function observation(partial: Partial<WindReading>): WindReading {
  return {
    source: "SWS Spit",
    kind: "observation",
    observedOrValidAt: "2026-08-14T20:50:00.000Z",
    fetchedAt: "2026-08-14T20:51:00.000Z",
    averageKnots: 16,
    gustKnots: 18,
    lullKnots: 14,
    directionDegrees: 220,
    stale: false,
    ...partial,
  }
}

function marine(partial: Partial<MarineHazard> = {}): MarineHazard {
  return {
    source: "Environment Canada Howe Sound",
    issuedAt: "10:30 AM PDT 14 August 2026",
    fetchedAt: "2026-08-14T20:51:00.000Z",
    hasWarning: false,
    hasThunderRisk: false,
    summary: "No watches or warnings in effect.",
    warningText: "No watches or warnings in effect.",
    forecastText: "Wind southerly inflow 10 to 15 knots.",
    ...partial,
  }
}

describe("getKiteHint", () => {
  it("uses observation average only for size bands", () => {
    expect(getKiteHint(observation({ averageKnots: 14 })).label).toBe(
      "Wait / light"
    )
    expect(getKiteHint(observation({ averageKnots: 16 })).sizeMeters).toBe(14)
    expect(getKiteHint(observation({ averageKnots: 19 })).sizeMeters).toBe(12)
    expect(getKiteHint(observation({ averageKnots: 22 })).sizeMeters).toBe(10)
  })

  it("does not produce a kite size from forecast readings", () => {
    const hint = getKiteHint({
      source: "Open-Meteo (model)",
      kind: "forecast",
      observedOrValidAt: "2026-08-14T20:50:00.000Z",
      fetchedAt: "2026-08-14T20:51:00.000Z",
      averageKnots: 22,
      gustKnots: 28,
      directionDegrees: 220,
      stale: false,
    })

    expect(hint.sizeMeters).toBeNull()
    expect(hint.label).toBe("No observation")
  })

  it("refuses a size when observation is stale", () => {
    const hint = getKiteHint(observation({ stale: true, averageKnots: 18 }))

    expect(hint.sizeMeters).toBeNull()
    expect(hint.label).toBe("Data too old")
  })

  it("forces a hazard overlay when marine text has thunder or warning", () => {
    const withThunder = getKiteHint(
      observation({ averageKnots: 16 }),
      marine({ hasThunderRisk: true })
    )
    expect(withThunder.sizeMeters).toBe(14)
    expect(withThunder.hazardOverlay).toBe(true)
    expect(withThunder.reason).toMatch(/Marine hazard/i)

    const withWarning = getKiteHint(
      observation({ averageKnots: 19 }),
      marine({ hasWarning: true })
    )
    expect(withWarning.hazardOverlay).toBe(true)
  })

  it("holds on chaotic gusts in the 10 m band", () => {
    const hint = getKiteHint(
      observation({ averageKnots: 22, gustKnots: 36 })
    )

    expect(hint.sizeMeters).toBeNull()
    expect(hint.label).toBe("Gusty — hold")
  })
})

describe("parseMarineHtml", () => {
  it("detects thunderstorm risk and issued time from HTML text", () => {
    const html = `
      <html><body>
        <h1>Howe Sound</h1>
        <p>No watches or warnings in effect.</p>
        <h2>Marine Forecast</h2>
        <p>Issued 10:30 AM PDT 14 August 2026</p>
        <p>Showers ending this evening with a risk of thunderstorms.</p>
      </body></html>
    `
    const result = parseMarineHtml(html, new Date("2026-08-14T20:00:00.000Z"))

    expect(result.hasThunderRisk).toBe(true)
    expect(result.hasWarning).toBe(false)
    expect(result.issuedAt).toContain("10:30 AM PDT")
  })
})
