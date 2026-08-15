import { describe, expect, it } from "vitest"
import {
  formatObservationDayTitle,
  isDateKey,
  observationDateHref,
  parseObservationDate,
  shiftCalendarDate,
  swsObservationUrl,
} from "./observation-date"

describe("parseObservationDate", () => {
  it("falls back to today when the query is missing or invalid", () => {
    expect(parseObservationDate(undefined, "2026-08-14")).toBe("2026-08-14")
    expect(parseObservationDate("nope", "2026-08-14")).toBe("2026-08-14")
    expect(parseObservationDate("2026-02-31", "2026-08-14")).toBe("2026-08-14")
    expect(parseObservationDate(["2026-08-13", "2026-08-12"], "2026-08-14")).toBe(
      "2026-08-13"
    )
  })

  it("clamps future calendar days to today", () => {
    expect(parseObservationDate("2026-08-15", "2026-08-14")).toBe("2026-08-14")
  })

  it("keeps a valid archived day", () => {
    expect(parseObservationDate("2026-08-13", "2026-08-14")).toBe("2026-08-13")
  })
})

describe("shiftCalendarDate", () => {
  it("crosses month and year boundaries", () => {
    expect(shiftCalendarDate("2026-08-01", -1)).toBe("2026-07-31")
    expect(shiftCalendarDate("2026-12-31", 1)).toBe("2027-01-01")
  })
})

describe("observationDateHref", () => {
  it("omits the query for today and sets date for archives", () => {
    expect(observationDateHref("2026-08-14", "2026-08-14")).toBe("/")
    expect(observationDateHref("2026-08-13", "2026-08-14")).toBe(
      "/?date=2026-08-13"
    )
  })
})

describe("formatObservationDayTitle", () => {
  it("labels today vs an archived weekday", () => {
    expect(formatObservationDayTitle("2026-08-14", "2026-08-14")).toBe(
      "Today's observed wind"
    )
    expect(formatObservationDayTitle("2026-08-13", "2026-08-14")).toBe(
      "Thu, Aug 13"
    )
  })
})

describe("swsObservationUrl", () => {
  it("requests the Spit archive for the given calendar day", () => {
    expect(swsObservationUrl("2026-08-13")).toBe(
      "https://squamishwindsports.com/wind-data/getmet.php?wind_src=spit&reqdate=2026-08-13&reqtime=0"
    )
  })
})

describe("isDateKey", () => {
  it("rejects impossible calendar dates", () => {
    expect(isDateKey("2026-08-14")).toBe(true)
    expect(isDateKey("2026-13-01")).toBe(false)
    expect(isDateKey("2026-08-14T00:00")).toBe(false)
  })
})
