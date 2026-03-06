/* =========================================================
   MISSION ↔ FC SYNC (INAV MSPv1 – Correct Behaviour)
========================================================= */

import { sendMSP } from '../core/mspSender'
import { mission } from './missionState'
import { renderMissionList } from './missionRenderer'
import { addMarker, updatePolyline } from './missionMap'
import type { MissionType } from '../core/types'
import { showToast } from '../ui/notifications'
import { map } from "../mission/missionMap"
import L from 'leaflet'
/* =========================================================
   MSP COMMAND IDS
========================================================= */

const MSP_WP_MISSION_LOAD = 18
const MSP_WP_GETINFO      = 20
const MSP_WP              = 118
const MSP_SET_WP          = 209
const MSP_WP_RESET        = 204
const MSP_WP_MISSION_SAVE = 19
const MSP_EEPROM_WRITE    = 250
let pendingVerification: any[] | null = null
/* =========================================================
   INTERNAL STATE
========================================================= */

let expectedWpCount = 0
let receivedWpCount = 0
export let isFetching = false

/* =========================================================
   FETCH MISSION FROM FC
========================================================= */

export function fetchMissionFromFC() {

 showToast('Fetching Mission From FC !','info');

  mission.length = 0
  expectedWpCount = 0
  receivedWpCount = 0
  isFetching = true

  sendMSP(MSP_WP_RESET)

  setTimeout(() => {
    sendMSP(MSP_WP_MISSION_LOAD, [0])
  }, 60)

  setTimeout(() => {
    sendMSP(MSP_WP_GETINFO)
  }, 120)
}

/* =========================================================
   HANDLE MSP RESPONSES
========================================================= */

export function handleMissionMSP(cmd: number, payload: number[]) {

  if (!isFetching) return

  switch (cmd) {

    case MSP_WP_GETINFO:
      handleWpInfo(payload)
      break

    case MSP_WP:
      handleWp(payload)
      break
  }
}

/* =========================================================
   HANDLE GETINFO
========================================================= */

function handleWpInfo(payload: number[]) {

  if (!payload || payload.length < 4) return

  const ramCount    = payload[0]
  const eepromCount = payload[3]


  const count = ramCount > 0 ? ramCount : eepromCount

  if (count === 0) {
    showToast('No mission stored in FC', 'warn')
    isFetching = false
    return
  }

  expectedWpCount = count

  for (let i = 1; i <= count; i++) {
    sendMSP(MSP_WP, [i])
  }
}

/* =========================================================
   HANDLE SINGLE WAYPOINT (REAL INAV STRUCTURE)
========================================================= */

function handleWp(payload: number[]) {

  if (!payload || payload.length < 21) return

  const buffer = new Uint8Array(payload).buffer
  const view = new DataView(buffer)

  const wpNumber   = view.getUint8(0)
  const actionCode = view.getUint8(1)

  const latRaw = view.getInt32(2, true)
  const lonRaw = view.getInt32(6, true)
  const altRaw = view.getInt32(10, true)

  const p1 = view.getUint16(14, true)
  const p2 = view.getUint16(16, true)
  const p3 = view.getUint16(18, true)

  const flag = view.getUint8(20)

  /* -------------------------------------------------------
     SKIP TERMINATOR / EMPTY ENTRY
     (This is your garbage index 0 fix)
  ------------------------------------------------------- */

// Skip ONLY the true terminator entry
if (
  wpNumber === 0 &&
  latRaw === 0 &&
  lonRaw === 0 &&
  altRaw === 0 &&
  actionCode === 0
) {
  receivedWpCount++
  return
}

  /* -------------------------------------------------------
     BUILD MISSION ITEM
  ------------------------------------------------------- */

  mission.push({
    id: wpNumber,
    lat: latRaw / 1e7,
    lon: lonRaw / 1e7,
    alt: altRaw / 100,
    type: decodeActionCode(actionCode),
    p1,
    p2,
    p3,
    flag
  })

  receivedWpCount++

  if (receivedWpCount === expectedWpCount) {
    isFetching = false
    rebuildMissionOnMap()

    if (pendingVerification) {

      const success = deepCompareMissions(pendingVerification, mission)

      if (success) {
        showToast("Mission verification successful ✔", "success")
      } else {
        showToast("Mission verification FAILED ❌", "error")
        console.warn("Original:", pendingVerification)
        console.warn("Fetched :", mission)
      }

      pendingVerification = null
    }
  }
}

function deepCompareMissions(a: any[], b: any[]): boolean {

  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {

    const wpA = a[i]
    const wpB = b[i]

    if (
      wpA.type !== wpB.type ||
      Math.abs(wpA.lat - wpB.lat) > 0.0000001 ||
      Math.abs(wpA.lon - wpB.lon) > 0.0000001 ||
      Math.abs(wpA.alt - wpB.alt) > 0.01 ||
      (wpA.p1 ?? 0) !== (wpB.p1 ?? 0) ||
      (wpA.p2 ?? 0) !== (wpB.p2 ?? 0) ||
      (wpA.p3 ?? 0) !== (wpB.p3 ?? 0)
    ) {
      return false
    }
  }

  return true
}
/* =========================================================
   UPLOAD MISSION
========================================================= */
export async function uploadMissionToFC() {
 debugger
  if (!mission.length) {
    showToast("No mission to upload", "warn")
    return
  }

  showToast("Uploading mission to FC...", "info")
  pendingVerification = JSON.parse(JSON.stringify(mission))

  /* STEP 1 — Load EEPROM into RAM */
  sendMSP(MSP_WP_MISSION_LOAD, [0])
  await delay(150)

  /* STEP 2 — Reset RAM mission */
  sendMSP(MSP_WP_RESET)
  await delay(150)

  /* STEP 3 — Write each waypoint with spacing */
  for (let index = 0; index < mission.length; index++) {

    const wp = mission[index]
    const isLast = index === mission.length - 1
    const flag = isLast ? 165 : 0

        const payload: number[] = [
      index + 1,

      encodeActionType(wp.type),

      ...write32(Math.round(wp.lat * 1e7)),
      ...write32(Math.round(wp.lon * 1e7)),
      ...write32(Math.round(wp.alt * 100)),

      ...write16(wp.p1 ?? 0),
      ...write16(wp.p2 ?? 0),
      ...write16(wp.p3 ?? 0),

      flag
    ]
    sendMSP(MSP_SET_WP, payload)

    await delay(40)  // IMPORTANT spacing
  }

  /* STEP 4 — Save mission slot */
  sendMSP(MSP_WP_MISSION_SAVE, [0])
  await delay(150)

  /* STEP 5 — Write EEPROM */
  sendMSP(MSP_EEPROM_WRITE)
  await delay(500)

  showToast("Mission written to FC & EEPROM", "success")

  /* STEP 6 — Verify */
  showToast("Verifying mission...", "info")
  fetchMissionFromFC()
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
/* =========================================================
   MAP REBUILD
========================================================= */

export function rebuildMissionOnMap() {

  if (!mission.length) return

  mission.forEach(wp => addMarker(wp))

  updatePolyline()

  const latLngs = mission.map(wp => [wp.lat, wp.lon] as [number, number])

  if (latLngs.length === 1) {
    map.setView(latLngs[0], 17)
  } else {
    const bounds = L.latLngBounds(latLngs)
    map.fitBounds(bounds, {
      padding: [60, 60],     // breathing room
      maxZoom: 18,           // don’t zoom too aggressively
      animate: true
    })
  }

  renderMissionList()

  showToast("Mission loaded and centered", "success")

}

/* =========================================================
   ACTION MAPPING (INAV CORRECT)
========================================================= */

function decodeActionCode(code: number): MissionType {

  switch (code) {
    case 1:  return "WAYPOINT"
    case 3:  return "PH_TIME"
    case 4:  return "RTH"
    case 5:  return "POI"
    case 6:  return "JUMP"
    case 7:  return "SET_HEAD"
    case 8:  return "LAND"
    default: return "WAYPOINT"
  }
}

function encodeActionType(type: MissionType): number {

  switch (type) {
    case "WAYPOINT": return 1
    case "PH_TIME":  return 3
    case "RTH":      return 4
    case "POI":  return 5
    case "JUMP":     return 6
    case "SET_HEAD": return 7
    case "LAND":     return 8
    default:         return 1
  }
}

/* =========================================================
   BINARY HELPERS
========================================================= */

function write32(value: number): number[] {
  return [
    value & 0xFF,
    (value >> 8) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 24) & 0xFF
  ]
}

function write16(value: number): number[] {
  return [
    value & 0xFF,
    (value >> 8) & 0xFF
  ]
}