const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/

export function isDateKey(value: string): boolean {
  const match = DATE_KEY.exec(value)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utc = new Date(Date.UTC(year, month - 1, day))

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  )
}

export function parseObservationDate(
  raw: string | string[] | undefined,
  todayKey: string
): string {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value || !isDateKey(value) || value > todayKey) {
    return todayKey
  }

  return value
}

export function shiftCalendarDate(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number)
  const utc = new Date(Date.UTC(year!, month! - 1, day! + days))
  return utc.toISOString().slice(0, 10)
}

export function observationDateHref(
  dateKey: string,
  todayKey: string
): string {
  if (dateKey === todayKey) {
    return "/"
  }

  return `/?date=${dateKey}`
}

export function formatObservationDayTitle(
  dateKey: string,
  todayKey: string
): string {
  if (dateKey === todayKey) {
    return "Today's observed wind"
  }

  const [year, month, day] = dateKey.split("-").map(Number)
  const utc = new Date(Date.UTC(year!, month! - 1, day!, 12))

  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(utc)
}

export function swsObservationUrl(reqdate: string): string {
  return `https://squamishwindsports.com/wind-data/getmet.php?wind_src=spit&reqdate=${reqdate}&reqtime=0`
}
