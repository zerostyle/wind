import type { ForecastHour } from "./types"

export type ForecastPeak = {
  averageKnots: number
  gustKnots: number
  startAt: string
  endAt: string
}

export type ForecastTimeline = {
  hours: ForecastHour[]
  peak: ForecastPeak | null
}

export function getForecastTimeline(
  hourly: ForecastHour[],
  referenceIso: string,
  limit = 9
): ForecastTimeline {
  const referenceTime = new Date(referenceIso).getTime()
  const futureHours = hourly
    .filter((hour) => new Date(hour.validAt).getTime() >= referenceTime)
    .slice(0, limit)

  if (futureHours.length === 0) {
    return { hours: [], peak: null }
  }

  const peakSpeed = Math.max(
    ...futureHours.map((hour) => hour.averageKnots)
  )
  const peakStart = futureHours.findIndex(
    (hour) => hour.averageKnots === peakSpeed
  )
  let peakEnd = peakStart

  while (
    peakEnd + 1 < futureHours.length &&
    futureHours[peakEnd + 1]?.averageKnots === peakSpeed
  ) {
    peakEnd += 1
  }

  const peakHours = futureHours.slice(peakStart, peakEnd + 1)

  return {
    hours: futureHours,
    peak: {
      averageKnots: peakSpeed,
      gustKnots: Math.max(...peakHours.map((hour) => hour.gustKnots)),
      startAt: futureHours[peakStart]!.validAt,
      endAt: futureHours[peakEnd]!.validAt,
    },
  }
}
