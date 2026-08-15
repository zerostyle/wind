"use client"

import { useMemo } from "react"
import { defineChart, lineY, areaY } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { Chart } from "@tanstack/charts/react"
import { scaleUtc } from "d3-scale"
import { useTheme } from "next-themes"

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
}

type ObservedWindChartProps = {
  samples: ChartSample[]
}

export function ObservedWindChart({ samples }: ObservedWindChartProps) {
  const { resolvedTheme } = useTheme()

  const definition = useMemo(() => {
    const observed = readThemeColor("--observed", "#5ecde1")
    const muted = readThemeColor("--muted-foreground", "#8f9aa3")
    const foreground = readThemeColor("--foreground", "#f3f5f4")
    const border = readThemeColor("--border", "#2a3035")

    return defineChart({
      marks: [
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
        grid: true,
        axis: {
          label: "Knots",
        },
      },
      tooltip,
      theme: {
        background: "transparent",
        foreground: muted,
        grid: border,
      },
    })
  }, [samples, resolvedTheme])

  if (samples.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        No observation samples to chart.
      </div>
    )
  }

  return (
    <Chart
      definition={definition}
      height={250}
      ariaLabel="Observed Spit wind average, gust, and lull in knots"
      className="w-full"
    />
  )
}
