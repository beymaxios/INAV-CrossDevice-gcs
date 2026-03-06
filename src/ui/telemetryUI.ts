import { updateQuadPosition} from '../mission/missionMap'
import { setQuadStatus } from '../mission/missionMap'

/* =========================
   BASIC UI HELPERS
========================= */

export function setText(id: string, value: string) {
  const el = document.getElementById(id)
  if (el) el.innerText = value
}

export function resetTelemetry() {
  setText("stat-sat", "0")
  setText("stat-hdop", "NA")
  setText("stat-batt", "0.0V")
  setText("stat-lq", "0%")
}


export function showFooterMessage(message: string) {
  const footer = document.getElementById("status-footer")
  if (!footer) return

  footer.classList.remove("hidden")
  footer.innerText = message
}

export function hideFooter() {
  const footer = document.getElementById("status-footer")
  if (!footer) return

  footer.classList.add("hidden")
  footer.innerText = ""
}
/* =========================
   LORA LATENCY
========================= */

export function updateLoraIndicator(latency: number) {

  const el = document.getElementById("stat-lora")
  if (!el) return

  el.innerText = latency.toFixed(0) + " ms"

  if (latency < 120) {
    el.style.color = "#22c55e"
  } else if (latency < 250) {
    el.style.color = "#f59e0b"
  } else {
    el.style.color = "#ef4444"
  }
}

/* =========================
   ARMED STATUS
========================= */

export function updateArmedStatus(isArmed: boolean) {

  const el = document.getElementById("stat-armed")
  if (!el) return

  if (isArmed) {
    el.innerText = "ARMED"
    el.style.color = "#ef4444"
  } else {
    el.innerText = "DISARMED"
    el.style.color = "#22c55e"
  }
   setQuadStatus(isArmed)
}

/* =========================
   FLIGHT MODE
========================= */

export function updateFlightModeDisplay(
  navMode: number,
  isAngle: boolean
) {

  const el = document.getElementById("stat-mode")
  if (!el) return

  let modeText = ""
  let color = "#94a3b8"

  switch (navMode) {

    case 0:
      if (isAngle) {
        modeText = "ANGLE"
        color = "#22c55e"
      } else {
        modeText = "ACRO"
        color = "#94a3b8"
      }
      break

    case 1:
      modeText = "POSHOLD"
      color = "#3b82f6"
      break

    case 2:
      modeText = "RTH"
      color = "#ef4444"
      break

    case 3:
      modeText = "CRUISE"
      color = "#a855f7"
      break

    default:
      modeText = `NAV:${navMode}`
      color = "#f59e0b"
  }

  el.innerText = modeText
  el.style.color = color
}

/* =========================
   GPS OVERLAY
========================= */

export function updateGpsOverlay(
  lat: number,
  lon: number,
  alt: number,
  speed: number,
  fixType: number,
  sat: number,
  hdop: number,
  headingFromState: number
) {

  setText("gps-lat", lat.toFixed(6))
  setText("gps-lon", lon.toFixed(6))
  setText("gps-alt", alt.toFixed(1) + " m")
  setText("gps-speed", speed + " m/s")
  setText("stat-sat", sat.toString())
  setText("stat-hdop", hdop.toFixed(1))
  setText("stat-heading", headingFromState.toFixed(1) + "°")
  const fixText =
    fixType === 2 ? "3D FIX" :
    fixType === 1 ? "2D FIX" :
    "NO FIX"

  const fixEl = document.getElementById("gps-fix")
  if (fixEl) {

    if (fixType === 2) {
      fixEl.style.color = "#22c55e"
       updateQuadPosition(lat, lon, headingFromState)
    } else if (fixType === 1) {
      fixEl.style.color = "#f59e0b"
    } else {
      fixEl.style.color = "#ef4444"
    }

    fixEl.innerText = fixText
  }
}

/* =========================
   HOME DISTANCE
========================= */

export function updateDistanceToHome(
  currentLat: number,
  currentLon: number,
  homeLat: number,
  homeLon: number
) {

  const R = 6371000

  const dLat = (homeLat - currentLat) * Math.PI / 180
  const dLon = (homeLon - currentLon) * Math.PI / 180

  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(currentLat * Math.PI/180) *
    Math.cos(homeLat * Math.PI/180) *
    Math.sin(dLon/2)**2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c

  setText("gps-dist-home", distance.toFixed(1) + " m")
}

/* =========================
   HOME ARROW
========================= */

export function updateHomeArrow(
  currentLat: number,
  currentLon: number,
  homeLat: number,
  homeLon: number
) {

  const lat1 = currentLat * Math.PI / 180
  const lat2 = homeLat * Math.PI / 180
  const dLon = (homeLon - currentLon) * Math.PI / 180

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const bearing = Math.atan2(y, x) * 180 / Math.PI

  const icon = document.getElementById("home-dir-icon")
  if (icon) {
    icon.style.transform = `rotate(${bearing}deg)`
  }
}



export function resetTelemetryUI() {

  setText("stat-sat", "0")
  setText("stat-hdop", "NA")
  setText("stat-batt", "0.0V")
  setText("stat-lq", "0%")
  setText("stat-lora", "--")

  const armEl = document.getElementById("stat-armed")
  if (armEl) {
    armEl.innerText = "DISARMED"
    armEl.style.color = "#22c55e"
  }

  const modeEl = document.getElementById("stat-mode")
  if (modeEl) {
    modeEl.innerText = "MANUAL"
    modeEl.style.color = "#94a3b8"
  }

}