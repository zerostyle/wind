"use client"

import { useMemo } from "react"
import { defineChart, lineY, areaY } from "@tanstack/charts"
import { scaleLinear } from "@tanstack/charts/scales/linear"
import { tooltip } from "@tanstack/charts/tooltip"
import { Chart } from "@tanstack/charts/react"
import { scaleUtc } from "d3-scale"

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
  const definition = useMemo(() => {
    return defineChart({
      marks: [
        areaY(samples, {
          id: "gust-lull-band",
          x: "time",
          y1: "lullKnots",
          y2: "gustKnots",
          fill: "#2dd4bf",
          fillOpacity: 0.14,
        }),
        lineY(samples, {
          id: "lull",
          x: "time",
          y: "lullKnots",
          stroke: "#64748b",
          strokeWidth: 1.25,
        }),
        lineY(samples, {
          id: "gust",
          x: "time",
          y: "gustKnots",
          stroke: "#f59e0b",
          strokeWidth: 1.5,
        }),
        lineY(samples, {
          id: "average",
          x: "time",
          y: "averageKnots",
          stroke: "#5eead4",
          strokeWidth: 2.25,
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
        foreground: "#94a3b8",
        grid: "#1e293b",
      },
    })
  }, [samples])

  if (samples.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-400">
        No observation samples to chart.
      </div>
    )
  }

  return (
    <Chart
      definition={definition}
      height={288}
      ariaLabel="Observed Spit wind average, gust, and lull in knots"
      className="w-full"
    />
  )
}
