import {
  degreesToCompass,
  formatKnots,
  formatVancouverTime,
} from "@/lib/wind/format"
import type { KiteHint, MarineHazard, WindReading } from "@/lib/wind/types"

export function SourceBadge({
  kind,
}: {
  kind: "observation" | "forecast" | "marine"
}) {
  const styles = {
    observation: "border-teal-400/40 bg-teal-400/10 text-teal-200",
    forecast: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    marine: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  } as const

  const labels = {
    observation: "Observed",
    forecast: "Forecast / model",
    marine: "Marine",
  } as const

  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] uppercase ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
  )
}

export function NowPanel({
  reading,
  error,
}: {
  reading: WindReading | null
  error?: string
}) {
  if (error || !reading) {
    return (
      <section className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-5">
        <div className="mb-3 flex items-center gap-2">
          <SourceBadge kind="observation" />
          <h2 className="font-heading text-lg text-rose-100">Spit now</h2>
        </div>
        <p className="text-sm text-rose-200/90">
          {error ?? "No observation available."}
        </p>
      </section>
    )
  }

  const compass =
    reading.directionDegrees !== undefined
      ? degreesToCompass(reading.directionDegrees)
      : "—"

  return (
    <section className="relative overflow-hidden rounded-xl border border-teal-500/25 bg-[linear-gradient(160deg,rgba(15,118,110,0.18),rgba(2,6,23,0.85)_45%,rgba(15,23,42,0.95))] p-5 shadow-[inset_0_1px_0_rgba(94,234,212,0.12)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(45,212,191,0.16),transparent_45%)]" />
      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SourceBadge kind="observation" />
          <h2 className="font-heading text-lg tracking-wide text-teal-50">
            Spit now
          </h2>
          {reading.stale ? (
            <span className="rounded-sm border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-amber-200 uppercase">
              Stale
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="mb-1 font-mono text-[10px] tracking-[0.2em] text-teal-300/80 uppercase">
              Average
            </p>
            <p className="font-mono text-6xl leading-none font-semibold tracking-tight text-teal-100 tabular-nums sm:text-7xl">
              {formatKnots(reading.averageKnots, 1)}
              <span className="ml-2 text-xl font-normal text-teal-300/70">
                kt
              </span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Gust
              </p>
              <p className="font-mono text-xl text-amber-200 tabular-nums">
                {formatKnots(reading.gustKnots)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Lull
              </p>
              <p className="font-mono text-xl text-slate-300 tabular-nums">
                {formatKnots(reading.lullKnots)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] tracking-widest text-slate-400 uppercase">
                Dir
              </p>
              <p className="font-mono text-xl text-sky-200 tabular-nums">
                {compass}
                {reading.directionDegrees !== undefined ? (
                  <span className="ml-1 text-sm text-slate-400">
                    {Math.round(reading.directionDegrees)}°
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 font-mono text-xs text-slate-400">
          Observed {formatVancouverTime(reading.observedOrValidAt)} · SWS Spit
          sensor
        </p>
        {reading.stale ? (
          <p className="mt-2 text-sm text-amber-200/90">
            This reading is stale. Do not treat it as current launch wind.
          </p>
        ) : null}
      </div>
    </section>
  )
}

export function KiteHintPanel({ hint }: { hint: KiteHint | null }) {
  if (!hint) {
    return null
  }

  return (
    <section
      className={`rounded-xl border p-4 ${
        hint.hazardOverlay
          ? "border-rose-400/40 bg-rose-950/40"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <p className="mb-1 font-mono text-[10px] tracking-[0.2em] text-slate-400 uppercase">
        Personal reference, not advice
      </p>
      <p className="font-heading text-2xl text-slate-50">{hint.label}</p>
      <p className="mt-1 text-sm text-slate-300">{hint.reason}</p>
      {hint.hazardOverlay ? (
        <p className="mt-2 text-sm font-medium text-rose-200">
          Hazard overlay active — not a clean go.
        </p>
      ) : null}
    </section>
  )
}

export function MarineBanner({
  marine,
  error,
}: {
  marine: MarineHazard | null
  error?: string
}) {
  if (error || !marine) {
    return (
      <section className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-4">
        <div className="mb-2 flex items-center gap-2">
          <SourceBadge kind="marine" />
          <h2 className="font-heading text-base text-sky-100">
            Howe Sound marine
          </h2>
        </div>
        <p className="text-sm text-sky-100/80">
          {error ?? "Marine forecast unavailable."}
        </p>
      </section>
    )
  }

  const tone =
    marine.hasWarning || marine.hasThunderRisk
      ? "border-rose-400/35 bg-rose-950/35"
      : "border-sky-500/25 bg-sky-950/25"

  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <SourceBadge kind="marine" />
        <h2 className="font-heading text-base text-sky-50">Howe Sound marine</h2>
      </div>
      <p className="text-sm font-medium text-slate-100">{marine.summary}</p>
      {marine.warningText ? (
        <p className="mt-2 text-sm text-slate-300">{marine.warningText}</p>
      ) : null}
      {marine.forecastText ? (
        <p className="mt-2 line-clamp-4 text-sm text-slate-400">
          {marine.forecastText}
        </p>
      ) : null}
      <p className="mt-3 font-mono text-[11px] text-slate-500">
        {marine.issuedAt ? `Issued ${marine.issuedAt}` : "Issue time unknown"} ·
        Environment Canada
      </p>
    </section>
  )
}
