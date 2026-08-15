"use client"

import { useEffect, useMemo, useState } from "react"
import { defineChart, lineY, areaY, ruleY, vector } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { Chart } from "@tanstack/charts/react"
import { scaleUtc } from "d3-scale"
import { useTheme } from "next-themes"
import {
  degreesToCompass,
  flowHeadingDegrees,
  selectDirectionMarkers,
} from "@/lib/wind/format"

function readThemeColor(name: string, fallback: string) {
  if (typeof document === "undefined") {
    return fallback
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  )
}

export type ChartSample = {
  time: Date
  averageKnots: number
  gustKnots: number
  lullKnots: number
  directionDegrees?: number
}

type ObservedWindChartProps = {
  samples: ChartSample[]
}

const MOBILE_CHART_HEIGHT = 250
const DESKTOP_CHART_HEIGHT = 400
const DESKTOP_CHART_MQ = "(min-width: 768px)"

const observedChartHeightClass = "h-[250px] md:h-[400px]"

function getObservedChartHeight() {
  if (typeof window === "undefined") {
    return MOBILE_CHART_HEIGHT
  }

  return window.matchMedia(DESKTOP_CHART_MQ).matches
    ? DESKTOP_CHART_HEIGHT
    : MOBILE_CHART_HEIGHT
}

function useObservedChartHeight() {
  const [height, setHeight] = useState(getObservedChartHeight)

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_CHART_MQ)
    const syncHeight = () => {
      setHeight(media.matches ? DESKTOP_CHART_HEIGHT : MOBILE_CHART_HEIGHT)
    }

    syncHeight()
    media.addEventListener("change", syncHeight)
    return () => media.removeEventListener("change", syncHeight)
  }, [])

  return height
}

export function ObservedWindChart({ samples }: ObservedWindChartProps) {
  const { resolvedTheme } = useTheme()
  const height = useObservedChartHeight()

  const definition = useMemo(() => {
    const observed = readThemeColor("--observed", "#5ecde1")
    const muted = readThemeColor("--muted-foreground", "#8f9aa3")
    const foreground = readThemeColor("--foreground", "#f3f5f4")
    const directionMarks = selectDirectionMarkers(samples).map((marker) => ({
      time: marker.time,
      plotKnots: 38,
      rotate: flowHeadingDegrees(marker.directionDegrees),
    }))

    return defineChart({
      marks: [
        ruleY([10, 20, 30, 40], {
          id: "knot-guides",
          stroke: muted,
          strokeWidth: 1,
          strokeOpacity: 0.25,
        }),
        areaY(samples, {
          id: "gust-lull-band",
          x: "time",
          y1: "lullKnots",
          y2: "gustKnots",
          fill: observed,
          fillOpacity: 0.05,
        }),
        lineY(samples, {
          id: "lull",
          x: "time",
          y: "lullKnots",
          stroke: muted,
          strokeWidth: 1,
        }),
        lineY(samples, {
          id: "gust",
          x: "time",
          y: "gustKnots",
          stroke: foreground,
          strokeWidth: 1,
        }),
        lineY(samples, {
          id: "average",
          x: "time",
          y: "averageKnots",
          stroke: observed,
          strokeWidth: 2.5,
        }),
        vector(directionMarks, {
          id: "direction",
          x: "time",
          y: "plotKnots",
          rotate: "rotate",
          length: 14,
          stroke: observed,
          strokeWidth: 1.5,
          headLength: 6,
          headAngle: 40,
          anchor: "middle",
        }),
      ],
      x: {
        scale: scaleUtc,
        nice: true,
        axis: {
          label: "Time (PT)",
        },
      },
      y: {
        scale: scaleLinear().domain([0, 40]),
        nice: false,
        grid: false,
        axis: {
          label: "Knots",
          ticks: { values: [0, 10, 20, 30, 40] },
        },
      },
      tooltip: {
        use: tooltip,
        items: [
          "x",
          "y",
          {
            id: "direction",
            label: "Direction",
            text: (point) => {
              const degrees = (point.datum as ChartSample | undefined)
                ?.directionDegrees
              if (degrees === undefined || !Number.isFinite(degrees)) {
                return undefined
              }

              return `${degreesToCompass(degrees)} ${Math.round(degrees)}°`
            },
          },
        ],
      },
      theme: {
        background: "transparent",
        foreground: muted,
      },
    })
  }, [samples, resolvedTheme])

  if (samples.length === 0) {
    return (
      <div
        className={`flex ${observedChartHeightClass} items-center justify-center text-sm text-muted-foreground`}
      >
        No observation samples to chart.
      </div>
    )
  }

  return (
    <Chart
      definition={definition}
      height={height}
      ariaLabel="Observed Spit wind average, gust, and lull in knots"
      className="w-full"
    />
  )
}
