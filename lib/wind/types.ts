export type WindKind = "observation" | "forecast"

export type WindReading = {
  source: string
  kind: WindKind
  observedOrValidAt: string
  fetchedAt: string
  averageKnots?: number
  gustKnots?: number
  lullKnots?: number
  directionDegrees?: number
  temperatureCelsius?: number
  stale: boolean
}

export type SwsPayload = {
  dt: string[]
  ws: string[]
  wg: string[]
  wl: string[]
  wd: string[]
  t?: string[]
}

export type WindSample = {
  observedAt: Date
  averageKnots: number
  gustKnots: number
  lullKnots: number
  directionDegrees: number
  temperatureCelsius?: number
}

export type MarineHazard = {
  source: string
  issuedAt: string | null
  fetchedAt: string
  hasWarning: boolean
  hasThunderRisk: boolean
  summary: string
  warningText: string | null
  forecastText: string | null
  error?: string
}

export type KiteSizeMeters = 10 | 12 | 14

export type KiteHint = {
  sizeMeters: KiteSizeMeters | null
  label: string
  reason: string
  hazardOverlay: boolean
  basedOnObservation: true
}

export type SourceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type ForecastHour = {
  validAt: string
  averageKnots: number
  gustKnots: number
  directionDegrees: number
}

export type ForecastLayer = {
  source: string
  kind: "forecast"
  fetchedAt: string
  current: WindReading
  hourly: ForecastHour[]
  note: string
}

export type ObservationLayer = {
  source: string
  kind: "observation"
  fetchedAt: string
  latest: WindReading
  samples: WindSample[]
}

export type TideExtremum = {
  kind: "low" | "high"
  eventAt: string
  heightFeet: number
}

export type TideLayer = {
  source: "CHS Squamish Inner"
  stationCode: "07811"
  fetchedAt: string
  nextLow: TideExtremum | null
  nextHigh: TideExtremum | null
}

export type WindSnapshot = {
  fetchedAt: string
  observation: SourceResult<ObservationLayer>
  forecast: SourceResult<ForecastLayer>
  marine: SourceResult<MarineHazard>
  kiteHint: KiteHint | null
}
