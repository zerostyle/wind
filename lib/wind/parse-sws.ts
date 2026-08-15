import type { SwsPayload, WindSample } from "./types"

export function parseSwsPayload(payload: SwsPayload): WindSample[] {
  const length = Math.min(
    payload.dt.length,
    payload.ws.length,
    payload.wg.length,
    payload.wl.length,
    payload.wd.length
  )

  const samples: WindSample[] = []

  for (let index = 0; index < length; index++) {
    const unixSeconds = Number(payload.dt[index])
    if (!Number.isFinite(unixSeconds)) {
      continue
    }

    const averageKnots = Number(payload.ws[index])
    const gustKnots = Number(payload.wg[index])
    const lullKnots = Number(payload.wl[index])
    const directionDegrees = Number(payload.wd[index])

    if (
      ![averageKnots, gustKnots, lullKnots, directionDegrees].every(
        Number.isFinite
      )
    ) {
      continue
    }

    const sample: WindSample = {
      observedAt: new Date(unixSeconds * 1000),
      averageKnots,
      gustKnots,
      lullKnots,
      directionDegrees,
    }

    const temperatureCelsius = Number(payload.t?.[index])
    if (Number.isFinite(temperatureCelsius)) {
      sample.temperatureCelsius = temperatureCelsius
    }

    samples.push(sample)
  }

  return samples
}

export function newestSample(samples: readonly WindSample[]): WindSample | null {
  if (samples.length === 0) {
    return null
  }

  return samples.reduce((newest, sample) =>
    sample.observedAt > newest.observedAt ? sample : newest
  )
}
