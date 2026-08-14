import { isStaleObservation } from "./freshness"
import { getKiteHint } from "./kite-hint"
import { newestSample, parseSwsPayload } from "./parse-sws"
import type {
  ForecastHour,
  ForecastLayer,
  MarineHazard,
  ObservationLayer,
  SourceResult,
  SwsPayload,
  WindReading,
  WindSnapshot,
} from "./types"

const REVALIDATE_SECONDS = 180
const SPIT_LAT = 49.6868
const SPIT_LON = -123.1784
const VANCOUVER_TZ = "America/Vancouver"

const SWS_URL = "https://squamishwindsports.com/wind-data/getmet.php"
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
const EC_RSS_URL = "https://weather.gc.ca/rss/marine/06400_e.xml"
const EC_HTML_URL =
  "https://weather.gc.ca/marine/forecast_e.html?mapID=02&siteID=06400"

function vancouverDateParam(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VANCOUVER_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function toIso(date: Date): string {
  return date.toISOString()
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      Accept: "application/json",
      "User-Agent": "wind-spit-conditions/0.1 (personal; Squamish kiteboarding)",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }

  return (await response.json()) as T
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "wind-spit-conditions/0.1 (personal; Squamish kiteboarding)",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`)
  }

  return response.text()
}

export function buildObservationLayer(
  payload: SwsPayload,
  fetchedAt: Date,
  now: Date = fetchedAt
): ObservationLayer {
  const samples = parseSwsPayload(payload)
  const newest = newestSample(samples)

  if (!newest) {
    throw new Error("SWS payload contained no usable samples")
  }

  const latest: WindReading = {
    source: "SWS Spit",
    kind: "observation",
    observedOrValidAt: toIso(newest.observedAt),
    fetchedAt: toIso(fetchedAt),
    averageKnots: newest.averageKnots,
    gustKnots: newest.gustKnots,
    lullKnots: newest.lullKnots,
    directionDegrees: newest.directionDegrees,
    stale: isStaleObservation(newest.observedAt, now),
  }

  return {
    source: "SWS Spit",
    kind: "observation",
    fetchedAt: toIso(fetchedAt),
    latest,
    samples,
  }
}

export async function fetchSwsObservation(
  now: Date = new Date()
): Promise<SourceResult<ObservationLayer>> {
  const fetchedAt = new Date()

  try {
    const reqdate = vancouverDateParam(now)
    const url = `${SWS_URL}?wind_src=spit&reqdate=${reqdate}&reqtime=0`
    const payload = await fetchJson<SwsPayload>(url)
    return {
      ok: true,
      data: buildObservationLayer(payload, fetchedAt, now),
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to fetch SWS",
    }
  }
}

type OpenMeteoResponse = {
  current?: {
    time: string
    wind_speed_10m: number
    wind_direction_10m: number
    wind_gusts_10m: number
  }
  hourly?: {
    time: string[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    wind_gusts_10m: number[]
  }
}

export function buildForecastLayer(
  payload: OpenMeteoResponse,
  fetchedAt: Date
): ForecastLayer {
  if (!payload.current) {
    throw new Error("Open-Meteo response missing current wind")
  }

  const current: WindReading = {
    source: "Open-Meteo (model)",
    kind: "forecast",
    observedOrValidAt: new Date(payload.current.time).toISOString(),
    fetchedAt: toIso(fetchedAt),
    averageKnots: payload.current.wind_speed_10m,
    gustKnots: payload.current.wind_gusts_10m,
    directionDegrees: payload.current.wind_direction_10m,
    stale: false,
  }

  const hourly: ForecastHour[] = []
  const times = payload.hourly?.time ?? []
  for (let i = 0; i < times.length; i++) {
    hourly.push({
      validAt: new Date(times[i]!).toISOString(),
      averageKnots: payload.hourly!.wind_speed_10m[i]!,
      gustKnots: payload.hourly!.wind_gusts_10m[i]!,
      directionDegrees: payload.hourly!.wind_direction_10m[i]!,
    })
  }

  return {
    source: "Open-Meteo",
    kind: "forecast",
    fetchedAt: toIso(fetchedAt),
    current,
    hourly,
    note: "Open-Meteo current is 15-minute model data, not the Spit sensor.",
  }
}

export async function fetchOpenMeteoForecast(): Promise<
  SourceResult<ForecastLayer>
> {
  const fetchedAt = new Date()

  try {
    const params = new URLSearchParams({
      latitude: String(SPIT_LAT),
      longitude: String(SPIT_LON),
      current: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
      wind_speed_unit: "kn",
      timezone: VANCOUVER_TZ,
      forecast_days: "1",
    })
    const payload = await fetchJson<OpenMeteoResponse>(
      `${OPEN_METEO_URL}?${params}`
    )
    return { ok: true, data: buildForecastLayer(payload, fetchedAt) }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch Open-Meteo",
    }
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function detectThunder(text: string): boolean {
  return /thunder|lightning|severe thunderstorm/i.test(text)
}

function detectWarning(text: string): boolean {
  if (/no watches or warnings in effect/i.test(text)) {
    return false
  }

  return /\b(warning|watch)\b/i.test(text)
}

function extractIssuedAt(text: string): string | null {
  const match = text.match(
    /Issued\s+(\d{1,2}:\d{2}\s*[AP]M\s+[A-Z]{3}\s+\d{1,2}\s+\w+\s+\d{4})/i
  )
  return match?.[1] ?? null
}

export function parseMarineHtml(html: string, fetchedAt: Date): MarineHazard {
  const text = stripTags(html)
  const hasThunderRisk = detectThunder(text)
  const hasWarning = detectWarning(text)
  const issuedAt = extractIssuedAt(text)

  let warningText: string | null = null
  if (hasWarning) {
    const warnMatch = text.match(
      /Warnings?\s+([\s\S]{0,280}?)(?:Forecast|Marine Forecast|Synopsis|$)/i
    )
    warningText = warnMatch?.[1]?.trim() || "Active marine watch or warning."
  } else if (/no watches or warnings in effect/i.test(text)) {
    warningText = "No watches or warnings in effect."
  }

  const forecastMatch = text.match(
    /Marine Forecast\s+([\s\S]{0,500}?)(?:Winds\s+Issued|Weather & Visibility|Stay connected|Technical Marine Synopsis|$)/i
  )
  const forecastText = forecastMatch?.[1]?.trim() || null

  const summary = hasWarning
    ? "Marine watch or warning in effect."
    : hasThunderRisk
      ? "Thunderstorm risk in the marine forecast."
      : "No watches or warnings in effect."

  return {
    source: "Environment Canada Howe Sound",
    issuedAt,
    fetchedAt: toIso(fetchedAt),
    hasWarning,
    hasThunderRisk,
    summary,
    warningText,
    forecastText,
  }
}

export function parseMarineRss(xml: string, fetchedAt: Date): MarineHazard {
  const issuedMatch = xml.match(
    /<updated>([^<]+)<\/updated>|<pubDate>([^<]+)<\/pubDate>/i
  )
  const issuedAt = issuedMatch?.[1] || issuedMatch?.[2] || null
  const text = stripTags(xml)
  const hasThunderRisk = detectThunder(text)
  const hasWarning =
    detectWarning(text) && !/no watches or warnings/i.test(text)

  return {
    source: "Environment Canada Howe Sound",
    issuedAt,
    fetchedAt: toIso(fetchedAt),
    hasWarning,
    hasThunderRisk,
    summary: hasWarning
      ? "Marine watch or warning in effect."
      : hasThunderRisk
        ? "Thunderstorm risk in the marine forecast."
        : "No watches or warnings in effect.",
    warningText: hasWarning
      ? text.slice(0, 280)
      : "No watches or warnings in effect.",
    forecastText: text.slice(0, 500),
  }
}

export async function fetchMarineHazard(): Promise<SourceResult<MarineHazard>> {
  const fetchedAt = new Date()

  try {
    try {
      const rss = await fetchText(EC_RSS_URL)
      return { ok: true, data: parseMarineRss(rss, fetchedAt) }
    } catch {
      const html = await fetchText(EC_HTML_URL)
      return { ok: true, data: parseMarineHtml(html, fetchedAt) }
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Environment Canada marine forecast",
    }
  }
}

export async function getWindSnapshot(
  now: Date = new Date()
): Promise<WindSnapshot> {
  const [observation, forecast, marine] = await Promise.all([
    fetchSwsObservation(now),
    fetchOpenMeteoForecast(),
    fetchMarineHazard(),
  ])

  const marineData = marine.ok ? marine.data : null
  const kiteHint = observation.ok
    ? getKiteHint(observation.data.latest, marineData)
    : getKiteHint(null, marineData)

  return {
    fetchedAt: toIso(now),
    observation,
    forecast,
    marine,
    kiteHint,
  }
}
