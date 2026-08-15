const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
] as const

export function degreesToCompass(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360
  const index = Math.round(normalized / 22.5) % 16
  return COMPASS[index]!
}

export type DirectionSample = {
  time: Date
  directionDegrees?: number
}

export type DirectionMarker = {
  time: Date
  directionDegrees: number
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

export function circularAngleDelta(a: number, b: number): number {
  const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b))
  return Math.min(raw, 360 - raw)
}

export function flowHeadingDegrees(fromDegrees: number): number {
  return normalizeDegrees(fromDegrees + 180)
}

const DEFAULT_DIRECTION_THRESHOLD_DEGREES = 15
const DEFAULT_DIRECTION_MIN_INTERVAL_MS = 20 * 60 * 1000

export function selectDirectionMarkers(
  samples: readonly DirectionSample[],
  thresholdDegrees = DEFAULT_DIRECTION_THRESHOLD_DEGREES,
  minIntervalMs = DEFAULT_DIRECTION_MIN_INTERVAL_MS
): DirectionMarker[] {
  const markers: DirectionMarker[] = []

  for (const sample of samples) {
    const degrees = sample.directionDegrees
    if (degrees === undefined || !Number.isFinite(degrees)) {
      continue
    }

    const last = markers.at(-1)
    if (
      last === undefined ||
      (circularAngleDelta(last.directionDegrees, degrees) >= thresholdDegrees &&
        sample.time.getTime() - last.time.getTime() >= minIntervalMs)
    ) {
      markers.push({ time: sample.time, directionDegrees: degrees })
    }
  }

  return markers
}

export function formatFixed(value: number | undefined, digits = 1): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "—"
  }
  return value.toFixed(digits)
}

export function formatKnots(value: number | undefined, digits = 1): string {
  return formatFixed(value, digits)
}

export function formatVancouverTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}
