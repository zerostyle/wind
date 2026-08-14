const VANCOUVER_TZ = "America/Vancouver"
export const STALE_AFTER_MS = 20 * 60 * 1000

export function vancouverDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VANCOUVER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function isStaleObservation(
  observedAt: Date,
  now: Date = new Date()
): boolean {
  if (now.getTime() - observedAt.getTime() > STALE_AFTER_MS) {
    return true
  }

  return vancouverDateKey(observedAt) !== vancouverDateKey(now)
}
