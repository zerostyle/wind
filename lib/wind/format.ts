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
