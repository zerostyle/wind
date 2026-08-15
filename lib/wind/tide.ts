import type { SourceResult, TideExtremum, TideLayer } from "./types"

export const SQUAMISH_INNER_STATION_ID = "5cebf1de3d0f4a073c4bb94e"
export const SQUAMISH_INNER_STATION_CODE = "07811"
export const METRES_TO_FEET = 3.280839895
const TIDE_REVALIDATE_SECONDS = 1800
const IWLS_DATA_URL = `https://api-iwls.dfo-mpo.gc.ca/api/v1/stations/${SQUAMISH_INNER_STATION_ID}/data`

export type IwlsHiloPoint = {
  eventDate: string
  value: number
}

export function metresToFeet(metres: number): number {
  return metres * METRES_TO_FEET
}

function classifyPoint(
  value: number,
  previous?: number,
  next?: number
): TideExtremum["kind"] | null {
  if (previous === undefined && next === undefined) {
    return null
  }

  if (previous === undefined) {
    if (value < next!) {
      return "low"
    }
    if (value > next!) {
      return "high"
    }
    return null
  }

  if (next === undefined) {
    if (value < previous) {
      return "low"
    }
    if (value > previous) {
      return "high"
    }
    return null
  }

  if (value < previous && value < next) {
    return "low"
  }
  if (value > previous && value > next) {
    return "high"
  }
  return null
}

export function classifyHiloPoints(
  points: readonly IwlsHiloPoint[]
): TideExtremum[] {
  const sorted = points
    .map((point) => ({
      at: new Date(point.eventDate),
      metres: point.value,
    }))
    .filter(
      (point) =>
        Number.isFinite(point.at.getTime()) && Number.isFinite(point.metres)
    )
    .toSorted((left, right) => left.at.getTime() - right.at.getTime())

  if (sorted.length < 2) {
    return []
  }

  return sorted.flatMap((point, index) => {
    const kind = classifyPoint(
      point.metres,
      sorted[index - 1]?.metres,
      sorted[index + 1]?.metres
    )
    if (!kind) {
      return []
    }

    return [
      {
        kind,
        eventAt: point.at.toISOString(),
        heightFeet: metresToFeet(point.metres),
      },
    ]
  })
}

export function pickNextTide(
  points: readonly IwlsHiloPoint[],
  now: Date,
  fetchedAt: Date
): TideLayer {
  const future = classifyHiloPoints(points).filter(
    (point) => new Date(point.eventAt) > now
  )

  return {
    source: "CHS Squamish Inner",
    stationCode: SQUAMISH_INNER_STATION_CODE,
    fetchedAt: fetchedAt.toISOString(),
    nextLow: future.find((point) => point.kind === "low") ?? null,
    nextHigh: future.find((point) => point.kind === "high") ?? null,
  }
}

export async function fetchTidePredictions(
  now: Date = new Date()
): Promise<SourceResult<TideLayer>> {
  const fetchedAt = new Date()
  const from = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
  const to = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
  const url = `${IWLS_DATA_URL}?${new URLSearchParams({
    "time-series-code": "wlp-hilo",
    from,
    to,
  })}`

  try {
    const response = await fetch(url, {
      next: { revalidate: TIDE_REVALIDATE_SECONDS },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "wind-spit-conditions/0.1 (personal; Squamish kiteboarding)",
      },
    })

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) for ${url}`)
    }

    const points = (await response.json()) as IwlsHiloPoint[]
    if (!Array.isArray(points)) {
      throw new Error("IWLS response was not a high/low series")
    }

    return { ok: true, data: pickNextTide(points, now, fetchedAt) }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch CHS tides",
    }
  }
}
