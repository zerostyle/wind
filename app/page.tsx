import { WindDashboard } from "@/components/wind/wind-dashboard"
import { getWindSnapshot } from "@/lib/wind/sources"

export const metadata = {
  title: "Pepahím̓ Spit Wind · Squamish",
  description:
    "Observed Spit wind, labeled forecast build, and Howe Sound marine hazards for Squamish kiteboarding.",
}

export default async function Page() {
  const snapshot = await getWindSnapshot()
  const chartSamples = snapshot.observation.ok
    ? snapshot.observation.data.samples.map((sample) => ({
        time: sample.observedAt,
        averageKnots: sample.averageKnots,
        gustKnots: sample.gustKnots,
        lullKnots: sample.lullKnots,
      }))
    : []

  return <WindDashboard snapshot={snapshot} chartSamples={chartSamples} />
}
