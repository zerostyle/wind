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

export const TIDE_GRAPHIC_WIDTH = 100
export const TIDE_GRAPHIC_HEIGHT = 36

export type TideGraphicMarker = {
  x: number
  y: number
  kind: TideExtremum["kind"]
  eventAt: string
  heightFeet: number
}

export type TideGraphic = {
  linePath: string
  areaPath: string
  now: { x: number; y: number } | null
  markers: TideGraphicMarker[]
  trend: "rising" | "falling" | null
}

function cosineInterpolate(start: number, end: number, t: number): number {
  const mu = (1 - Math.cos(t * Math.PI)) / 2
  return start * (1 - mu) + end * mu
}

function sampleTideCurve(
  extrema: readonly TideExtremum[],
  stepsPerSpan = 12
): Array<{ at: number; heightFeet: number }> {
  if (extrema.length === 0) {
    return []
  }

  const samples: Array<{ at: number; heightFeet: number }> = [
    {
      at: new Date(extrema[0]!.eventAt).getTime(),
      heightFeet: extrema[0]!.heightFeet,
    },
  ]

  for (let index = 1; index < extrema.length; index++) {
    const previous = extrema[index - 1]!
    const current = extrema[index]!
    const start = new Date(previous.eventAt).getTime()
    const end = new Date(current.eventAt).getTime()
    const span = end - start
    if (span <= 0) {
      continue
    }

    for (let step = 1; step <= stepsPerSpan; step++) {
      const t = step / stepsPerSpan
      samples.push({
        at: start + span * t,
        heightFeet: cosineInterpolate(
          previous.heightFeet,
          current.heightFeet,
          t
        ),
      })
    }
  }

  return samples
}

function heightToY(
  heightFeet: number,
  minHeight: number,
  maxHeight: number
): number {
  const range = Math.max(maxHeight - minHeight, 1)
  const normalized = (heightFeet - minHeight) / range
  return TIDE_GRAPHIC_HEIGHT - 3 - normalized * (TIDE_GRAPHIC_HEIGHT - 6)
}

export function buildTideGraphic(
  extrema: readonly TideExtremum[],
  now: Date
): TideGraphic | null {
  if (extrema.length < 2) {
    return null
  }

  const samples = sampleTideCurve(extrema)
  const times = samples.map((sample) => sample.at)
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const span = Math.max(maxTime - minTime, 1)
  const heights = extrema.map((point) => point.heightFeet)
  const minHeight = Math.min(...heights)
  const maxHeight = Math.max(...heights)

  const toX = (at: number) => ((at - minTime) / span) * TIDE_GRAPHIC_WIDTH
  const toY = (heightFeet: number) =>
    heightToY(heightFeet, minHeight, maxHeight)

  const linePath = samples
    .map((sample, index) => {
      const command = index === 0 ? "M" : "L"
      return `${command}${toX(sample.at).toFixed(2)},${toY(sample.heightFeet).toFixed(2)}`
    })
    .join(" ")

  const areaPath = `${linePath} L${TIDE_GRAPHIC_WIDTH},${TIDE_GRAPHIC_HEIGHT} L0,${TIDE_GRAPHIC_HEIGHT} Z`

  const nowMs = now.getTime()
  let nowPoint: TideGraphic["now"] = null
  if (nowMs >= minTime && nowMs <= maxTime) {
    const afterIndex = samples.findIndex((sample) => sample.at >= nowMs)
    const after = samples[afterIndex] ?? samples.at(-1)!
    const before = samples[Math.max(afterIndex - 1, 0)]!
    const localSpan = after.at - before.at
    const t = localSpan === 0 ? 0 : (nowMs - before.at) / localSpan
    nowPoint = {
      x: toX(before.at + localSpan * t),
      y: toY(cosineInterpolate(before.heightFeet, after.heightFeet, t)),
    }
  }

  const next = extrema.find((point) => new Date(point.eventAt) > now)

  return {
    linePath,
    areaPath,
    now: nowPoint,
    markers: extrema.map((point) => ({
      x: toX(new Date(point.eventAt).getTime()),
      y: toY(point.heightFeet),
      kind: point.kind,
      eventAt: point.eventAt,
      heightFeet: point.heightFeet,
    })),
    trend: next ? (next.kind === "high" ? "rising" : "falling") : null,
  }
}

export function pickNextTide(
  points: readonly IwlsHiloPoint[],
  now: Date,
  fetchedAt: Date
): TideLayer {
  const extrema = classifyHiloPoints(points)
  const future = extrema.filter((point) => new Date(point.eventAt) > now)

  return {
    source: "CHS Squamish Inner",
    stationCode: SQUAMISH_INNER_STATION_CODE,
    fetchedAt: fetchedAt.toISOString(),
    extrema,
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
