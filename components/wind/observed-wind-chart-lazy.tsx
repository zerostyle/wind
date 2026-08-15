"use client"

import dynamic from "next/dynamic"
import type { ChartSample } from "./observed-wind-chart"

const ObservedWindChart = dynamic(
  () =>
    import("./observed-wind-chart").then((mod) => mod.ObservedWindChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[250px] items-center justify-center text-sm text-[#8f9aa3]">
        Loading chart…
      </div>
    ),
  }
)

export function ObservedWindChartLazy({ samples }: { samples: ChartSample[] }) {
  return <ObservedWindChart samples={samples} />
}
