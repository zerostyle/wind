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
          fill: "#5ecde1",
          fillOpacity: 0.05,
        }),
        lineY(samples, {
          id: "lull",
          x: "time",
          y: "lullKnots",
          stroke: "#8f9aa3",
          strokeWidth: 1,
        }),
        lineY(samples, {
          id: "gust",
          x: "time",
          y: "gustKnots",
          stroke: "#f3f5f4",
          strokeWidth: 1,
        }),
        lineY(samples, {
          id: "average",
          x: "time",
          y: "averageKnots",
          stroke: "#5ecde1",
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
        foreground: "#8f9aa3",
        grid: "#2a3035",
      },
    })
  }, [samples])

  if (samples.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-[#8f9aa3]">
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
