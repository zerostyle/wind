import { ObservedWindChartLazy } from "@/components/wind/observed-wind-chart-lazy"
import {
  degreesToCompass,
  formatKnots,
  formatVancouverTime,
} from "@/lib/wind/format"
import { getForecastTimeline } from "@/lib/wind/forecast-timeline"
import type { WindSnapshot } from "@/lib/wind/types"
import type { ChartSample } from "./observed-wind-chart"

type WindDashboardProps = {
  snapshot: WindSnapshot
  chartSamples: ChartSample[]
}

const hourFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Vancouver",
  hour: "numeric",
  hour12: true,
})

export function WindDashboard({ snapshot, chartSamples }: WindDashboardProps) {
  const observation = snapshot.observation.ok ? snapshot.observation.data : null
  const forecast = snapshot.forecast.ok ? snapshot.forecast.data : null
  const marine = snapshot.marine.ok ? snapshot.marine.data : null
  const reading = observation?.latest ?? null
  const timeline = forecast
    ? getForecastTimeline(forecast.hourly, snapshot.fetchedAt)
    : { hours: [], peak: null }
  const peakStart = timeline.peak
    ? hourFormatter.format(new Date(timeline.peak.startAt))
    : null
  const peakEnd = timeline.peak
    ? hourFormatter.format(new Date(timeline.peak.endAt))
    : null
  const peakRange =
    peakStart && peakEnd && peakStart !== peakEnd
      ? `${peakStart}–${peakEnd}`
      : peakStart
  const direction =
    reading?.directionDegrees !== undefined
      ? `${degreesToCompass(reading.directionDegrees)} ${Math.round(reading.directionDegrees)}°`
      : "—"

  return (
    <main className="min-h-svh overflow-x-hidden bg-[#090b0c] text-[#f3f5f4]">
      <div className="mx-auto flex min-h-svh w-full max-w-[1440px] flex-col gap-4 px-5 py-6 min-[1440px]:h-[900px] min-[1440px]:min-h-[900px] md:px-8">
        <header className="flex min-h-[72px] flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#8f9aa3] uppercase">
              Squamish · Howe Sound
            </p>
            <h1 className="mt-0.5 text-[25px] leading-tight font-semibold tracking-[-0.02em] text-[#f3f5f4]">
              Pepahím̓ / The Spit
            </h1>
            <p className="mt-0.5 text-xs text-[#8f9aa3]">
              Live Spit sensor, expected model build, and Environment Canada
              marine hazards — kept separate.
            </p>
          </div>

          <div className="shrink-0 md:text-right">
            <p className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[#f3f5f4] uppercase">
              Snapshot {formatVancouverTime(snapshot.fetchedAt)}
            </p>
            <div className="mt-1.5 flex items-center gap-3.5 font-mono text-[9px] font-semibold tracking-[0.08em] text-[#8f9aa3] uppercase md:justify-end">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#5ecde1]" />
                Observed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#c3cbd1]" />
                Model
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#e8b84a]" />
                Marine
              </span>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 min-[1440px]:grid-cols-[minmax(0,824px)_minmax(0,528px)]">
          <section className="flex min-h-0 flex-col gap-3.5 bg-[#0e1113] p-5 min-[1440px]:h-[560px]">
            <div className="flex min-h-[42px] items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#5ecde1] uppercase">
                  Observed · Spit sensor
                </p>
                <h2 className="mt-0.5 text-[19px] leading-tight font-semibold">
                  Today&apos;s observed wind
                </h2>
              </div>
              {reading ? (
                <p
                  className={`inline-flex items-center gap-2 px-2.5 py-2 font-mono text-[9px] font-semibold tracking-[0.06em] uppercase ${
                    reading.stale
                      ? "bg-[#e8b84a]/10 text-[#e8b84a]"
                      : "bg-[#5ecde1]/10 text-[#5ecde1]"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {reading.stale ? "Stale" : "Current"} ·{" "}
                  {formatVancouverTime(reading.observedOrValidAt)}
                </p>
              ) : null}
            </div>

            <div className="grid min-h-[118px] gap-5 md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="flex min-h-[102px] flex-col justify-center border-l-2 border-[#5ecde1] bg-[#5ecde1]/5 px-3.5 py-2.5">
                <p className="font-mono text-[9px] font-semibold tracking-[0.13em] text-[#5ecde1] uppercase">
                  Average
                </p>
                <p className="mt-1 flex items-end gap-2 font-mono tabular-nums">
                  <span className="text-6xl leading-[0.9] font-medium tracking-[-0.055em]">
                    {formatKnots(reading?.averageKnots, 1)}
                  </span>
                  <span className="text-base leading-none font-semibold text-[#5ecde1]">
                    kt
                  </span>
                </p>
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-3">
                <dl className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="font-mono text-[8px] font-semibold tracking-[0.1em] text-[#8f9aa3] uppercase">
                      Gust
                    </dt>
                    <dd className="mt-1 font-mono text-lg tabular-nums">
                      {formatKnots(reading?.gustKnots)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[8px] font-semibold tracking-[0.1em] text-[#8f9aa3] uppercase">
                      Lull
                    </dt>
                    <dd className="mt-1 font-mono text-lg tabular-nums">
                      {formatKnots(reading?.lullKnots)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[8px] font-semibold tracking-[0.1em] text-[#8f9aa3] uppercase">
                      Direction
                    </dt>
                    <dd className="mt-1 font-mono text-lg tabular-nums">
                      {direction}
                    </dd>
                  </div>
                </dl>

                <p
                  className={`flex min-h-8 items-center border-l-2 px-3 text-[11px] font-medium ${
                    reading?.stale
                      ? "border-[#e8b84a] bg-[#e8b84a]/5 text-[#e8b84a]"
                      : "border-[#5ecde1] bg-[#5ecde1]/5 text-[#8f9aa3]"
                  }`}
                >
                  {reading?.stale
                    ? "Data too old for a current launch decision."
                    : snapshot.observation.ok
                      ? "Live sensor reading is within the freshness window."
                      : snapshot.observation.error}
                </p>
              </div>
            </div>

            <div className="flex min-h-[260px] flex-1 flex-col border border-[#2a3035] bg-[#0b0e10] px-4 pt-3.5 pb-2">
              <div className="flex min-h-6 items-center justify-between gap-4">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-[#8f9aa3] uppercase">
                  Wind today · knots
                </p>
                <div className="flex items-center gap-3.5 font-mono text-[8px] text-[#8f9aa3] uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-2.5 bg-[#5ecde1]" />
                    Avg
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-px w-2.5 bg-[#f3f5f4]" />
                    Gust
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-px w-2.5 bg-[#8f9aa3]" />
                    Lull
                  </span>
                </div>
              </div>
              {snapshot.observation.ok ? (
                <ObservedWindChartLazy samples={chartSamples} />
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-[#8f9aa3]">
                  Chart unavailable until the Spit sensor loads.
                </div>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-3 bg-[#0e1113] p-5 min-[1440px]:h-[560px]">
            <div className="flex min-h-[42px] items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#c3cbd1] uppercase">
                  Forecast · Open-Meteo
                </p>
                <h2 className="mt-0.5 text-[19px] leading-tight font-semibold">
                  Expected build
                </h2>
              </div>
              <p className="font-mono text-[9px] font-semibold tracking-[0.08em] text-[#8f9aa3] uppercase">
                Model, not observed
              </p>
            </div>

            {forecast ? (
              <>
                <div className="flex min-h-[76px] items-center gap-4">
                  <p className="flex w-36 shrink-0 items-end gap-1.5 font-mono tabular-nums">
                    <span className="text-4xl leading-none font-medium tracking-[-0.04em] text-[#c3cbd1]">
                      {formatKnots(forecast.current.averageKnots, 1)}
                    </span>
                    <span className="text-[13px] leading-none text-[#8f9aa3]">
                      kt
                    </span>
                  </p>
                  <div>
                    <p className="font-mono text-[13px] font-semibold">
                      {forecast.current.directionDegrees !== undefined
                        ? `${degreesToCompass(forecast.current.directionDegrees)} · ${Math.round(forecast.current.directionDegrees)}°`
                        : "Direction unavailable"}
                    </p>
                    <p className="mt-1 font-mono text-[8px] tracking-[0.06em] text-[#8f9aa3] uppercase">
                      Valid{" "}
                      {formatVancouverTime(forecast.current.observedOrValidAt)}{" "}
                      · 15-min model
                    </p>
                  </div>
                </div>

                <div className="flex min-h-[300px] flex-1 flex-col gap-1.5">
                  <div className="flex min-h-[30px] items-center justify-between gap-4">
                    <p className="font-mono text-[9px] font-semibold tracking-[0.08em] text-[#8f9aa3] uppercase">
                      Expected peak
                    </p>
                    {timeline.peak ? (
                      <p className="font-mono text-[10px] font-semibold tabular-nums">
                        {peakRange} ·{" "}
                        {formatKnots(timeline.peak.averageKnots, 0)} kt · gust{" "}
                        {formatKnots(timeline.peak.gustKnots, 0)}
                      </p>
                    ) : null}
                  </div>

                  {timeline.hours.length > 0 ? (
                    timeline.hours.map((hour) => {
                      const isPeak =
                        timeline.peak !== null &&
                        hour.validAt >= timeline.peak.startAt &&
                        hour.validAt <= timeline.peak.endAt

                      return (
                        <div
                          key={hour.validAt}
                          className={`flex min-h-8 flex-1 items-center gap-3 px-2 ${
                            isPeak ? "bg-[#c3cbd1]/5" : ""
                          }`}
                        >
                          <p
                            className={`w-7 shrink-0 font-mono text-[9px] font-semibold ${
                              isPeak ? "text-[#f3f5f4]" : "text-[#8f9aa3]"
                            }`}
                          >
                            {hourFormatter.format(new Date(hour.validAt))}
                          </p>
                          <div className="h-[7px] min-w-0 flex-1 bg-[#242a2e]">
                            <div
                              className={`h-full ${
                                isPeak ? "bg-[#f3f5f4]" : "bg-[#c3cbd1]"
                              }`}
                              style={{
                                width: `${Math.min((hour.averageKnots / 20) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <p
                            className={`w-[86px] shrink-0 text-right font-mono text-[9px] tabular-nums ${
                              isPeak
                                ? "font-semibold text-[#f3f5f4]"
                                : "text-[#c3cbd1]"
                            }`}
                          >
                            {formatKnots(hour.averageKnots, 0)} kt / g
                            {formatKnots(hour.gustKnots, 0)}
                          </p>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-[#8f9aa3]">
                      No upcoming hourly forecast available.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-[#8f9aa3]">
                {snapshot.forecast.ok
                  ? "No forecast data."
                  : snapshot.forecast.error}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6 min-[1440px]:h-[188px] min-[1440px]:grid-cols-[minmax(0,824px)_minmax(0,528px)]">
          <section className="grid gap-5 bg-[#0e1113] p-5 md:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#e8b84a] uppercase">
                Marine · Environment Canada
              </p>
              <h2 className="mt-1 text-lg font-semibold">Howe Sound marine</h2>
              <p className="mt-2 line-clamp-2 text-[13px] leading-[1.35] text-[#c3cbd1]">
                {marine?.forecastText ??
                  (snapshot.marine.ok
                    ? "Marine forecast unavailable."
                    : snapshot.marine.error)}
              </p>
              <p className="mt-2 font-mono text-[8px] tracking-[0.05em] text-[#8f9aa3] uppercase">
                {marine?.issuedAt
                  ? `Issued ${marine.issuedAt}`
                  : "Issue time unavailable"}
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-base ${
                    marine?.hasThunderRisk ? "text-[#e8b84a]" : "text-[#8f9aa3]"
                  }`}
                  aria-hidden="true"
                >
                  ϟ
                </span>
                <div>
                  <p
                    className={`font-mono text-[9px] font-semibold tracking-[0.06em] uppercase ${
                      marine?.hasThunderRisk
                        ? "text-[#e8b84a]"
                        : "text-[#c3cbd1]"
                    }`}
                  >
                    {marine?.hasThunderRisk
                      ? "Thunderstorm risk"
                      : "No thunderstorm risk"}
                  </p>
                  <p className="text-[11px] text-[#8f9aa3]">Marine forecast</p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-[11px] text-[#c3cbd1]">
                <span className="text-[#8f9aa3]" aria-hidden="true">
                  ○
                </span>
                {marine?.hasWarning
                  ? "Marine warning active"
                  : "No watches or warnings in effect"}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2.5 bg-[#0e1113] p-5">
            <div className="flex min-h-[50px] items-center gap-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-[#8f9aa3] uppercase">
                  Live camera
                </p>
                <p className="mt-0.5 text-[13px] font-medium">
                  Squamish Windsports
                </p>
              </div>
              <a
                href="https://www.youtube.com/watch?v=TDtXBtgQ-y0"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 bg-[#f3f5f4] px-3.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#090b0c] uppercase transition-colors hover:bg-[#c3cbd1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5ecde1]"
              >
                <span aria-hidden="true">▶</span>
                Open on YouTube
              </a>
            </div>

            <p className="font-mono text-[8px] tracking-[0.035em] text-[#8f9aa3] uppercase">
              Sources ·{" "}
              <a
                href="https://squamishwindsports.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#f3f5f4]"
              >
                SWS Spit sensor
              </a>{" "}
              ·{" "}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#f3f5f4]"
              >
                Open-Meteo
              </a>{" "}
              ·{" "}
              <a
                href="https://weather.gc.ca/marine/forecast_e.html?mapID=02&siteID=06400"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#f3f5f4]"
              >
                EC Howe Sound
              </a>
            </p>
            <p className="max-w-md text-[10px] leading-[1.3] text-[#8f9aa3]">
              Personal reference, not advice. Observation schema and
              availability may change without notice.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
