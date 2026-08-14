import type { KiteHint, KiteSizeMeters, MarineHazard, WindReading } from "./types"

const CHAOTIC_GUST_DELTA_KT = 12

function bandForAverage(averageKnots: number): {
  sizeMeters: KiteSizeMeters | null
  label: string
  reason: string
} {
  if (averageKnots < 15) {
    return {
      sizeMeters: null,
      label: "Wait / light",
      reason: `Steady ${averageKnots.toFixed(1)} kt is below the 15 kt starting band.`,
    }
  }

  if (averageKnots <= 17) {
    return {
      sizeMeters: 14,
      label: "14 m",
      reason: `Steady ${averageKnots.toFixed(1)} kt sits in the 15–17 kt band for 14 m.`,
    }
  }

  if (averageKnots <= 20) {
    return {
      sizeMeters: 12,
      label: "12 m",
      reason: `Steady ${averageKnots.toFixed(1)} kt sits in the 18–20 kt band for 12 m.`,
    }
  }

  return {
    sizeMeters: 10,
    label: "10 m",
    reason: `Steady ${averageKnots.toFixed(1)} kt is in the stronger band; 10 m only if manageable.`,
  }
}

export function hasMarineHazard(marine: MarineHazard | null | undefined): boolean {
  if (!marine) {
    return false
  }

  return marine.hasWarning || marine.hasThunderRisk
}

export function getKiteHint(
  observation: WindReading | null | undefined,
  marine?: MarineHazard | null
): KiteHint {
  const hazardOverlay = hasMarineHazard(marine)

  if (!observation || observation.kind !== "observation") {
    return {
      sizeMeters: null,
      label: "No observation",
      reason: "Kite size uses Spit sensor readings only — never forecast.",
      hazardOverlay,
      basedOnObservation: true,
    }
  }

  if (observation.stale) {
    return {
      sizeMeters: null,
      label: "Data too old",
      reason: "Observation is stale; do not pick a kite from outdated wind.",
      hazardOverlay,
      basedOnObservation: true,
    }
  }

  const average = observation.averageKnots
  if (average === undefined || !Number.isFinite(average)) {
    return {
      sizeMeters: null,
      label: "No average",
      reason: "Observation is missing average wind speed.",
      hazardOverlay,
      basedOnObservation: true,
    }
  }

  let band = bandForAverage(average)

  if (
    band.sizeMeters === 10 &&
    observation.gustKnots !== undefined &&
    Number.isFinite(observation.gustKnots) &&
    observation.gustKnots - average >= CHAOTIC_GUST_DELTA_KT
  ) {
    band = {
      sizeMeters: null,
      label: "Gusty — hold",
      reason: `Gusts are ${observation.gustKnots.toFixed(1)} kt against ${average.toFixed(1)} kt average; wait for cleaner wind before 10 m.`,
    }
  }

  if (hazardOverlay) {
    return {
      ...band,
      reason: `${band.reason} Marine hazard is active — not a clean go.`,
      hazardOverlay: true,
      basedOnObservation: true,
    }
  }

  return {
    ...band,
    hazardOverlay: false,
    basedOnObservation: true,
  }
}
