import { formatFixed, formatVancouverTime } from "@/lib/wind/format"
import type { SourceResult, TideExtremum, TideLayer } from "@/lib/wind/types"

type ConditionsStripProps = {
  temperatureCelsius?: number
  tide: SourceResult<TideLayer>
}

function StripValue({
  label,
  labelClassName,
  unitClassName,
  value,
  unit,
  detail,
}: {
  label: string
  labelClassName: string
  unitClassName: string
  value: string
  unit: string
  detail?: string
}) {
  return (
    <div className="min-w-0">
      <p
        className={`font-mono text-[9px] font-semibold tracking-[0.12em] uppercase ${labelClassName}`}
      >
        {label}
      </p>
      <p className="mt-1 flex items-end gap-1.5 font-mono tabular-nums">
        <span className="text-[32px] leading-none font-medium tracking-[-0.04em]">
          {value}
        </span>
        <span
          className={`text-[13px] leading-none font-semibold ${unitClassName}`}
        >
          {unit}
        </span>
      </p>
      {detail ? (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function tideDetail(
  extremum: TideExtremum | null,
  unavailable: boolean
): string | undefined {
  if (unavailable) {
    return "Tide unavailable"
  }
  if (!extremum) {
    return "—"
  }
  return formatVancouverTime(extremum.eventAt)
}

export function ConditionsStrip({
  temperatureCelsius,
  tide,
}: ConditionsStripProps) {
  const nextLow = tide.ok ? tide.data.nextLow : null
  const nextHigh = tide.ok ? tide.data.nextHigh : null
  const unavailable = !tide.ok || (!nextLow && !nextHigh)

  return (
    <section className="grid gap-5 bg-card px-5 py-3 sm:grid-cols-3 min-[1440px]:items-center">
      <StripValue
        label="Air · Spit sensor"
        labelClassName="text-observed"
        unitClassName="text-observed"
        value={formatFixed(temperatureCelsius)}
        unit="°C"
      />
      <StripValue
        label="Next low · CHS"
        labelClassName="text-marine"
        unitClassName="text-marine"
        value={formatFixed(nextLow?.heightFeet)}
        unit="ft"
        detail={tideDetail(nextLow, unavailable)}
      />
      <StripValue
        label="Next high · CHS"
        labelClassName="text-marine"
        unitClassName="text-marine"
        value={formatFixed(nextHigh?.heightFeet)}
        unit="ft"
        detail={unavailable ? undefined : tideDetail(nextHigh, false)}
      />
    </section>
  )
}
