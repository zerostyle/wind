import { ObservedWindChartLazy } from "@/components/wind/observed-wind-chart-lazy"
import {
  KiteHintPanel,
  MarineBanner,
  NowPanel,
  SourceBadge,
} from "@/components/wind/panels"
import {
  degreesToCompass,
  formatKnots,
  formatVancouverTime,
} from "@/lib/wind/format"
import { getWindSnapshot } from "@/lib/wind/sources"

export const metadata = {
  title: "Pepahím̓ Spit Wind · Squamish",
  description:
    "Observed Spit wind, labeled forecast build, and Howe Sound marine hazards for Squamish kiteboarding.",
}

export default async function Page() {
  const snapshot = await getWindSnapshot()

  const observation = snapshot.observation.ok
    ? snapshot.observation.data
    : null
  const forecast = snapshot.forecast.ok ? snapshot.forecast.data : null
  const marine = snapshot.marine.ok ? snapshot.marine.data : null

  const chartSamples =
    observation?.samples.map((sample) => ({
      time: sample.observedAt,
      averageKnots: sample.averageKnots,
      gustKnots: sample.gustKnots,
      lullKnots: sample.lullKnots,
    })) ?? []

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,118,110,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.12),transparent_45%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(148,163,184,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.35)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
        <header className="space-y-3">
          <p className="font-mono text-[11px] tracking-[0.28em] text-teal-300/80 uppercase">
            Squamish · Howe Sound
          </p>
          <h1 className="font-heading text-4xl leading-none tracking-tight text-teal-50 sm:text-5xl">
            Pepahím̓ / The Spit
          </h1>
          <p className="max-w-xl text-sm text-slate-400">
            Three evidence layers, never collapsed: live Spit sensor, model
            expected build, and Environment Canada marine hazards. Forecast is
            not confirmation the wind has arrived.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <SourceBadge kind="observation" />
            <SourceBadge kind="forecast" />
            <SourceBadge kind="marine" />
          </div>
        </header>

        <section className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SourceBadge kind="observation" />
            <h2 className="font-heading text-lg text-slate-50">
              Today&apos;s observed wind
            </h2>
          </div>
          <div className="mb-3 flex flex-wrap gap-4 font-mono text-[11px] tracking-wide text-slate-400 uppercase">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-teal-300" /> Avg
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" /> Gust
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-500" /> Lull
            </span>
          </div>
          {snapshot.observation.ok ? (
            <ObservedWindChartLazy samples={chartSamples} />
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              Chart unavailable until SWS observation loads.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge kind="observation" />
              <h2 className="font-heading text-lg text-slate-50">Live cam</h2>
            </div>
            <a
              className="font-mono text-[11px] tracking-wide text-teal-300/80 uppercase underline-offset-2 hover:underline"
              href="https://www.youtube.com/watch?v=TDtXBtgQ-y0"
              target="_blank"
              rel="noreferrer"
            >
              Open on YouTube
            </a>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/TDtXBtgQ-y0?rel=0"
              title="Squamish Spit live cam"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            SWS webcam via YouTube. Stream availability depends on Squamish
            Windsports.
          </p>
        </section>

        <section className="rounded-xl border border-amber-400/20 bg-amber-950/20 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge kind="forecast" />
            <h2 className="font-heading text-lg text-amber-50">Expected build</h2>
          </div>
          {forecast ? (
            <>
              <p className="mb-3 text-sm text-amber-100/80">
                Model current:{" "}
                <span className="font-mono text-amber-50 tabular-nums">
                  {formatKnots(forecast.current.averageKnots)} kt
                </span>
                {forecast.current.directionDegrees !== undefined ? (
                  <>
                    {" "}
                    from{" "}
                    {degreesToCompass(forecast.current.directionDegrees)} (
                    {Math.round(forecast.current.directionDegrees)}°)
                  </>
                ) : null}
                . Valid {formatVancouverTime(forecast.current.observedOrValidAt)}
                .
              </p>
              <p className="mb-4 text-xs text-amber-200/70">{forecast.note}</p>
              <div className="-mx-1 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-2 px-1">
                  {forecast.hourly.map((hour) => (
                    <div
                      key={hour.validAt}
                      className="w-[4.5rem] rounded-lg border border-amber-400/15 bg-slate-950/50 px-2 py-2 text-center"
                    >
                      <p className="font-mono text-[10px] text-slate-400">
                        {new Intl.DateTimeFormat("en-CA", {
                          timeZone: "America/Vancouver",
                          hour: "numeric",
                          hour12: true,
                        }).format(new Date(hour.validAt))}
                      </p>
                      <p className="mt-1 font-mono text-lg text-amber-100 tabular-nums">
                        {formatKnots(hour.averageKnots, 0)}
                      </p>
                      <p className="font-mono text-[10px] text-amber-200/60">
                        g {formatKnots(hour.gustKnots, 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-amber-100/80">
              {snapshot.forecast.ok
                ? "No forecast data."
                : snapshot.forecast.error}
            </p>
          )}
        </section>

        <NowPanel
          reading={observation?.latest ?? null}
          error={
            snapshot.observation.ok ? undefined : snapshot.observation.error
          }
        />

        <KiteHintPanel hint={snapshot.kiteHint} />

        <MarineBanner
          marine={marine}
          error={snapshot.marine.ok ? undefined : snapshot.marine.error}
        />

        <footer className="space-y-2 border-t border-white/10 pt-4 text-xs text-slate-500">
          <p>
            Observed wind comes from an unofficial SWS Spit endpoint. Schema and
            availability can change without notice. Not for commercial or
            safety-critical use.
          </p>
          <p className="font-mono">
            Snapshot {formatVancouverTime(snapshot.fetchedAt)} · refresh ~3 min
          </p>
          <p className="flex flex-wrap gap-3">
            <a
              className="text-teal-300/80 underline-offset-2 hover:underline"
              href="https://squamishwindsports.com/"
              target="_blank"
              rel="noreferrer"
            >
              Squamish Windsports
            </a>
            <a
              className="text-sky-300/80 underline-offset-2 hover:underline"
              href="https://weather.gc.ca/marine/forecast_e.html?mapID=02&siteID=06400"
              target="_blank"
              rel="noreferrer"
            >
              EC Howe Sound
            </a>
            <a
              className="text-amber-300/80 underline-offset-2 hover:underline"
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}
