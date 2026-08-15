import { degreesToCompass, flowHeadingDegrees } from "@/lib/wind/format"

type WindDirectionCompassProps = {
  degrees?: number
}

export function WindDirectionCompass({ degrees }: WindDirectionCompassProps) {
  const hasDirection = degrees !== undefined && Number.isFinite(degrees)
  const label = hasDirection
    ? `${degreesToCompass(degrees)} ${Math.round(degrees)}°`
    : "—"
  const rotation = hasDirection ? flowHeadingDegrees(degrees) : 0

  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 40 40"
        className="size-8 shrink-0 text-observed"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <line
          x1="20"
          y1="3"
          x2="20"
          y2="7"
          stroke="currentColor"
          strokeWidth="1"
        />
        <line
          x1="37"
          y1="20"
          x2="33"
          y2="20"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="20"
          y1="37"
          x2="20"
          y2="33"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="3"
          y1="20"
          x2="7"
          y2="20"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <text
          x="20"
          y="11"
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="5"
          fontWeight="600"
        >
          N
        </text>
        {hasDirection ? (
          <g transform={`rotate(${rotation} 20 20)`}>
            <path
              d="M20 6 L23.4 22.5 L20 19.6 L16.6 22.5 Z"
              fill="currentColor"
            />
          </g>
        ) : null}
      </svg>
      <span className="font-mono text-lg tabular-nums">{label}</span>
    </div>
  )
}
