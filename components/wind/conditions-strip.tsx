import { formatFixed, formatVancouverTime } from "@/lib/wind/format"
import {
  TIDE_GRAPHIC_HEIGHT,
  TIDE_GRAPHIC_WIDTH,
  buildTideGraphic,
  type TideGraphic,
} from "@/lib/wind/tide"
import type { SourceResult, TideExtremum, TideLayer } from "@/lib/wind/types"

type ConditionsStripProps = {
  temperatureCelsius?: number
  tide: SourceResult<TideLayer>
  now: string
}

const TEMP_SCALE_MAX = 30

function tideDetail(extremum: TideExtremum | null, unavailable: boolean) {
  if (unavailable) {
    return "Tide unavailable"
  }
  if (!extremum) {
    return "—"
  }
  return formatVancouverTime(extremum.eventAt)
}

function TemperatureGauge({
  temperatureCelsius,
}: {
  temperatureCelsius?: number
}) {
  const fill =
    temperatureCelsius === undefined
      ? 0
      : Math.min(Math.max(temperatureCelsius / TEMP_SCALE_MAX, 0), 1)

  return (
    <div className="flex min-w-0 items-end gap-3">
      <div
        className="relative h-[72px] w-2.5 shrink-0 bg-track"
        aria-hidden="true"
      >
        <div
          className="absolute inset-x-0 bottom-0 bg-observed"
          style={{ height: `${fill * 100}%` }}
        />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-observed uppercase">
          Air · Spit sensor
        </p>
        <p className="mt-1 flex items-end gap-1.5 font-mono tabular-nums">
          <span className="text-[32px] leading-none font-medium tracking-[-0.04em]">
            {formatFixed(temperatureCelsius)}
          </span>
          <span className="text-[13px] leading-none font-semibold text-observed">
            °C
          </span>
        </p>
      </div>
    </div>
  )
}

function TideChart({ graphic }: { graphic: TideGraphic }) {
  return (
    <svg
      viewBox={`0 0 ${TIDE_GRAPHIC_WIDTH} ${TIDE_GRAPHIC_HEIGHT}`}
      className="h-[72px] w-full"
      role="img"
      aria-label={
        graphic.trend
          ? `Tide ${graphic.trend} over the next extrema`
          : "Predicted tide curve"
      }
    >
      <path d={graphic.areaPath} className="fill-marine/15" />
      <path
        d={graphic.linePath}
        className="fill-none stroke-marine"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      {graphic.markers.map((marker) => (
        <circle
          key={marker.eventAt}
          cx={marker.x}
          cy={marker.y}
          r="1.15"
          className={marker.kind === "high" ? "fill-marine" : "fill-foreground"}
        />
      ))}
      {graphic.now ? (
        <>
          <line
            x1={graphic.now.x}
            x2={graphic.now.x}
            y1="0"
            y2={TIDE_GRAPHIC_HEIGHT}
            className="stroke-foreground/40"
            strokeWidth="0.6"
            strokeDasharray="1.2 1.2"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={graphic.now.x}
            cy={graphic.now.y}
            r="1.6"
            className="fill-foreground"
          />
        </>
      ) : null}
    </svg>
  )
}

function ExtremumReadout({
  label,
  extremum,
  unavailable,
}: {
  label: string
  extremum: TideExtremum | null
  unavailable: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] font-semibold tracking-[0.1em] text-marine uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-lg tabular-nums">
        {formatFixed(extremum?.heightFeet)}
        <span className="ml-1 text-[11px] text-marine">ft</span>
      </p>
      <p className="font-mono text-[10px] text-muted-foreground">
        {tideDetail(extremum, unavailable)}
      </p>
    </div>
  )
}

export function ConditionsStrip({
  temperatureCelsius,
  tide,
  now,
}: ConditionsStripProps) {
  const nextLow = tide.ok ? tide.data.nextLow : null
  const nextHigh = tide.ok ? tide.data.nextHigh : null
  const extrema = tide.ok ? tide.data.extrema : []
  const unavailable = !tide.ok || (!nextLow && !nextHigh)
  const graphic = tide.ok ? buildTideGraphic(extrema, new Date(now)) : null

  return (
    <section className="grid gap-5 bg-card px-5 py-3.5 md:grid-cols-[160px_minmax(0,1fr)_220px] md:items-center">
      <TemperatureGauge temperatureCelsius={temperatureCelsius} />

      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-marine uppercase">
            Tide · CHS Squamish Inner
          </p>
          <p className="font-mono text-[8px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {unavailable
              ? "Unavailable"
              : graphic?.trend
                ? graphic.trend
                : "Predicted"}
          </p>
        </div>
        {unavailable || !graphic ? (
          <div className="flex h-[72px] items-center border-l-2 border-marine bg-marine/5 px-3 text-[11px] text-muted-foreground">
            Tide unavailable
          </div>
        ) : (
          <div className="border border-border bg-inset px-2 pt-1.5 pb-1">
            <TideChart graphic={graphic} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ExtremumReadout
          label="Next low"
          extremum={nextLow}
          unavailable={unavailable}
        />
        <ExtremumReadout
          label="Next high"
          extremum={nextHigh}
          unavailable={false}
        />
      </div>
    </section>
  )
}
