/* =========================================================
   TELEMETRY RUNTIME STATE
========================================================= */

/* =========================
   NAV + MODE
========================= */

export let currentNavMode = 0
export let currentIsAngle = false
export let currentIsArmed = false

/* =========================
   GPS DATA
========================= */

export let currentLat = 0
export let currentLon = 0
export let currentAlt = 0
export let currentSpeed = 0

export let currentSat = 0
export let currentHdop = 0

export let homeLat = 0
export let homeLon = 0
export let homeSet = false

export function setHome(lat: number, lon: number) {

  if (homeSet) return

  homeLat = lat
  homeLon = lon
  homeSet = true

  /* Notify map */
  window.dispatchEvent(new CustomEvent("home-set", {
    detail: { lat, lon }
  }))

}
/* =========================
   HEADING
========================= */

export let currentHeading = 0

/* =========================
   LORA LATENCY
========================= */

export let loraSendTime = 0
export let loraLatencySamples: number[] = []
export let loraAvgLatency = 0

/* =========================
   POLL CYCLE
========================= */

export let pollCycle = 0


export function incrementPollCycle() {
  pollCycle++
}

export function setLoraSendTime(value: number) {
  loraSendTime = value
}

/* =========================================================
   STATE UPDATE HELPERS
========================================================= */

export function setNavMode(mode: number) {
  currentNavMode = mode
}

export function setAngleMode(state: boolean) {
  currentIsAngle = state
}

export function setArmed(state: boolean) {
  currentIsArmed = state
   if (!state) {
    homeSet = false
  }
}

export function setHeading(heading: number) {
  currentHeading = heading
}

export function setGpsData(
  lat: number,
  lon: number,
  alt: number,
  speed: number,
  sat: number,
  hdop: number
) {
  currentLat = lat
  currentLon = lon
  currentAlt = alt
  currentSpeed = speed
  currentSat = sat
  currentHdop = hdop

  if (currentIsArmed && !homeSet && sat >= 6) {
    setHome(lat, lon)
  }

}

export function resetTelemetryState() {
  currentSat = 0
  currentHdop = 0
  currentIsArmed = false
  currentNavMode = 0
  loraSendTime = 0
  loraAvgLatency = 0
  homeLat = 0
  homeLon = 0
  homeSet = false
}



export function registerLoraSample(rtt: number) {

  loraLatencySamples.push(rtt)

  if (loraLatencySamples.length > 10) {
    loraLatencySamples.shift()
  }

  loraAvgLatency =
    loraLatencySamples.reduce((a, b) => a + b, 0) /
    loraLatencySamples.length
}