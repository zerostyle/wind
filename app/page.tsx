import { WindDashboard } from "@/components/wind/wind-dashboard"
import { vancouverDateKey } from "@/lib/wind/freshness"
import { parseObservationDate } from "@/lib/wind/observation-date"
import { getWindSnapshot } from "@/lib/wind/sources"

export const metadata = {
  title: "Pepahím̓ Spit Wind · Squamish",
  description:
    "Observed Spit wind, labeled forecast build, and Howe Sound marine hazards for Squamish kiteboarding.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>
}) {
  const now = new Date()
  const todayDate = vancouverDateKey(now)
  const { date } = await searchParams
  const observationDate = parseObservationDate(date, todayDate)
  const snapshot = await getWindSnapshot(now, observationDate)
  const chartSamples = snapshot.observation.ok
    ? snapshot.observation.data.samples.map((sample) => ({
        time: sample.observedAt,
        averageKnots: sample.averageKnots,
        gustKnots: sample.gustKnots,
        lullKnots: sample.lullKnots,
        directionDegrees: sample.directionDegrees,
      }))
    : []

  return (
    <WindDashboard
      snapshot={snapshot}
      chartSamples={chartSamples}
      observationDate={observationDate}
      todayDate={todayDate}
    />
  )
}
