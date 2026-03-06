import { mission, markers } from "./missionState"
import { validateMission } from "../validation/missionValidator"
import { showToast } from '../ui/notifications'
import { map } from "../mission/missionMap"
import { rebuildMissionOnMap } from "./missionMSP"
/* =========================
   SAVE
========================= */

export function saveMissionToFile() {

  if (!mission.length) {
    showToast("No mission to save", "warn")
    return
  }
  
  const errors = validateMissionForExport()

  if (errors.length) {
    showToast("Mission export blocked. Fix validation errors.", "error")
    console.error(errors)
    return
  }
  else
  {
    try {

          const xml = buildMissionXML()

          const blob = new Blob([xml], { type: "application/xml" })
          const url = URL.createObjectURL(blob)
              
          const a = document.createElement("a")
          a.href = url
          a.download = "mission.mission"
          a.click()

          URL.revokeObjectURL(url)

          showToast(`Mission saved to file (${mission.length} waypoints)`, "success")

        } catch (err) {
          console.error(err)
          showToast("Failed to save mission", "error")
        }
  }

}

function buildMissionXML(): string {

  if (!mission.length) return ""

  const avgLat = mission.reduce((sum, wp) => sum + wp.lat, 0) / mission.length
  const avgLon = mission.reduce((sum, wp) => sum + wp.lon, 0) / mission.length
  const currentZoom = map?.getZoom?.() ?? 18

  const items = mission.map((wp, index) => {
  
    const isLast = index === mission.length - 1

    // INAV requires last waypoint flag = 165
    const flag = isLast ? 165 : 0

    // Convert internal POI to INAV XML format
    const xmlAction = wp.type === "POI" ? "SET_POI" : wp.type

    return `\t<missionitem no="${index + 1}" action="${xmlAction}" lat="${wp.lat.toFixed(7)}" lon="${wp.lon.toFixed(7)}" alt="${wp.alt}" parameter1="${wp.p1 ?? 0}" parameter2="${wp.p2 ?? 0}" parameter3="${wp.p3 ?? 0}" flag="${flag}" />`

  }).join("\n")

 

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<mission>
  \t<version value="2.3-pre8"/>
  \t<mwp cx="${avgLon.toFixed(7)}" cy="${avgLat.toFixed(7)}" home-x="0" home-y="0" zoom="${currentZoom}"/>
  ${items}
</mission>`
}

/* =========================
   LOAD
========================= */

export function loadMissionFromFile() {

  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".mission"

  input.onchange = async (e: any) => {

    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      parseMissionXML(text)

      showToast(`Mission loaded (${mission.length} waypoints)`, "success")

      const errors = validateMission()
      if (errors.length) {
        showToast("Mission loaded with validation warnings", "warn")
      }

    } catch (err) {
      console.error(err)
      showToast("Invalid mission file", "error")
    }
  }

  input.click()
}

function parseMissionXML(xmlString: string) {

  const parser = new DOMParser()
  const xml = parser.parseFromString(xmlString, "application/xml")

  const nodes = xml.getElementsByTagName("missionitem")

  // Clear existing mission + markers
  mission.length = 0
  markers.forEach(m => m.remove())
  markers.length = 0

  for (let i = 0; i < nodes.length; i++) {

    const node = nodes[i]
    const actionAttr = node.getAttribute("action")

    let internalType = actionAttr

    // Normalize POI variants
    if (actionAttr === "SET_POI") {
    internalType = "POI"
    }

    mission.push({
    id: Number(node.getAttribute("no")),
    lat: Number(node.getAttribute("lat")),
    lon: Number(node.getAttribute("lon")),
    alt: Number(node.getAttribute("alt")),
    type: internalType as any,
    p1: Number(node.getAttribute("parameter1")),
    p2: Number(node.getAttribute("parameter2")),
    p3: Number(node.getAttribute("parameter3")),
    flag: Number(node.getAttribute("flag"))
    })
  }

  rebuildMissionOnMap()
}


function validateMissionForExport(): string[] {

  const errors: string[] = []

  if (mission.length === 0) {
    errors.push("Mission is empty.")
    return errors
  }

  // 1️⃣ POI cannot be last
  const last = mission[mission.length - 1]
  if (last.type === "POI") {
    errors.push("Last waypoint cannot be POI.")
  }

  // 2️⃣ JUMP validation
  mission.forEach((wp, index) => {

    if (wp.type === "JUMP") {

      if (wp.p1 < 1 || wp.p1 > mission.length) {
        errors.push(`JUMP at WP ${index + 1} has invalid target.`)
      }

      if (wp.p1 === index + 1) {
        errors.push(`JUMP at WP ${index + 1} cannot jump to itself.`)
      }
    }
  })

  // 3️⃣ POI must have at least one SET_POI
  const hasPOI = mission.some(w => w.type === "POI")
  const hasSetPOI = mission.some(w => w.type === "POI") // internal POI

  if (hasPOI && !hasSetPOI) {
    errors.push("POI used but no SET_POI defined.")
  }

  // 4️⃣ RTH must be last if exists
  mission.forEach((wp, index) => {
    if (wp.type === "RTH" && index !== mission.length - 1) {
      errors.push("RTH must be the final waypoint.")
    }
  })

  // 5️⃣ Check coordinates
  mission.forEach((wp, index) => {
    if (!isFinite(wp.lat) || !isFinite(wp.lon)) {
      errors.push(`Invalid coordinates at WP ${index + 1}`)
    }
  })

  return errors
}