import { logMessage } from '../ui/logUI'
import { isFetching } from '../mission/missionMSP'
import {
  setNavMode,
  setAngleMode,
  setArmed,
  setHeading,
  setGpsData,
  registerLoraSample,
  currentNavMode,
  currentIsAngle,
  currentIsArmed,
  homeLat,
  homeLon,
  loraSendTime,
  loraAvgLatency,
  currentHeading
} from './telemetryState'

import {
  updateFlightModeDisplay,
  updateArmedStatus,
  updateGpsOverlay,
  updateLoraIndicator,
  updateDistanceToHome,
  updateHomeArrow,
  setText,
  showFooterMessage,
  hideFooter
} from '../ui/telemetryUI'
import { updateLiveTrail } from '../mission/missionMap'
import { sendMSP } from './mspSender'
import { handleMissionMSP } from '../mission/missionMSP'
/* =========================================================
   MSP STREAM PARSER
========================================================= */

let mspBuffer: number[] = []

export function parseMSPStream(data: Uint8Array) {

  for (const byte of data) {

    mspBuffer.push(byte)

    if (mspBuffer.length < 6) continue

    /* ================= MSP v1 ================= */

    if (
      mspBuffer[0] === 36 &&
      mspBuffer[1] === 77 &&
      mspBuffer[2] === 62
    ) {

      const size = mspBuffer[3]
      const cmd = mspBuffer[4]

      if (mspBuffer.length >= size + 6) {

        const payload = mspBuffer.slice(5, 5 + size)
        const checksum = mspBuffer[5 + size]

        let calc = size ^ cmd
        payload.forEach(p => calc ^= p)

        if (calc === checksum) {
          handleMSPResponse(cmd, payload)
        }

        mspBuffer = []
      }

      continue
    }

    /* ================= MSP v2 ================= */

    if (
      mspBuffer[0] === 36 &&
      mspBuffer[1] === 88 &&
      mspBuffer[2] === 62
    ) {

      if (mspBuffer.length < 9) continue

      const cmd = mspBuffer[4] | (mspBuffer[5] << 8)
      const size = mspBuffer[6] | (mspBuffer[7] << 8)

      if (mspBuffer.length >= size + 9) {

        const payload = mspBuffer.slice(8, 8 + size)
        const crc = mspBuffer[8 + size]

        let calc = 0
        for (let i = 3; i < 8 + size; i++) {
          calc = crc8_dvb_s2(calc, mspBuffer[i])
        }

        if (calc === crc) {
          handleMSPv2Response(cmd, payload)
        }

        mspBuffer = []
      }

      continue
    }

    mspBuffer.shift()
  }
}

/* =========================================================
   MSP RESPONSE HANDLER
========================================================= */

function handleMSPResponse(cmd: number, payload: number[]) {
    handleMissionMSP(cmd, payload)
  /* ================= API VERSION ================= */

  if (cmd === 1 && payload.length >= 3) {
    logMessage(`INAV API ${payload[0]}.${payload[1]}.${payload[2]}`)
  }
  
 if (cmd === 18 && isFetching) {
 
  sendMSP(20, [0]) // MSP_WP_GETINFO
}

  /* ================= HEADING ================= */

  if (cmd === 108 && payload.length >= 6) {

    const yawRaw = payload[4] | (payload[5] << 8)
    const yaw = yawRaw > 32767 ? yawRaw - 65536 : yawRaw
    
    let heading = yaw 
    if (heading < 0) heading += 360
    console.log("MSP108 RECEIVED OVER WS: HEADING =", heading);
    setHeading(heading)
   
   
  }

  /* ================= BATTERY ================= */

  if (cmd === 110 && payload.length >= 5) {

    const voltage = (payload[0] / 10).toFixed(1)
    setText("stat-batt", `${voltage}V`)

    const rawRssi = payload[3] | (payload[4] << 8)
    const percent = Math.min(100, Math.round((rawRssi / 1023) * 100))

    setText("stat-lq", `${percent}%`)
  }

  /* ================= NAV STATUS ================= */

  if (cmd === 121 && payload.length >= 1) {
    setNavMode(payload[0])
    refreshFlightModeUI(currentNavMode, currentIsAngle)
  }

  function refreshFlightModeUI(navMode: number, isAngle: boolean) {
  updateFlightModeDisplay(navMode, isAngle)
}
  /* ================= STATUS EX (LORA RTT + ARM BLOCKS) ================= */

  if (cmd === 150 && payload.length >= 13) {

    const now = performance.now()
    const rtt = now - loraSendTime

    registerLoraSample(rtt)
    updateLoraIndicator(loraAvgLatency)

    const armingDisableFlags =
      payload[10] |
      (payload[11] << 8) |
      (payload[12] << 16) |
      (payload[13] << 24)

    const reasons: string[] = []

    if (armingDisableFlags & (1 << 0)) reasons.push("Gyro not detected")
    if (armingDisableFlags & (1 << 1)) reasons.push("Failsafe active")
    if (armingDisableFlags & (1 << 2)) reasons.push("No valid receiver signal")
    if (armingDisableFlags & (1 << 3)) reasons.push("Waiting for GPS 3D fix")
    if (armingDisableFlags & (1 << 4)) reasons.push("Lower throttle to arm")
    if (armingDisableFlags & (1 << 5)) reasons.push("Level aircraft to arm")
    if (armingDisableFlags & (1 << 6)) reasons.push("Boot grace period")
    if (armingDisableFlags & (1 << 7)) reasons.push("Pre-arm switch not enabled")
    if (armingDisableFlags & (1 << 8)) reasons.push("Navigation not ready")
    if (armingDisableFlags & (1 << 9)) reasons.push("Calibration required")
    if (armingDisableFlags & (1 << 10)) reasons.push("CLI mode active")
    if (armingDisableFlags & (1 << 11)) reasons.push("MSP override active")
    if (armingDisableFlags & (1 << 12)) reasons.push("Arm switch not engaged")

    if (!currentIsArmed && reasons.length > 0) {
      showFooterMessage(reasons.join(" • "))
    } else {
      hideFooter()
    }
  }

  /* ================= GPS RAW ================= */

  if (cmd === 106 && payload.length >= 18) {

    const fixType = payload[0]
    const numSat  = payload[1]

    const lat = read32Signed(payload, 2) / 1e7
    const lon = read32Signed(payload, 6) / 1e7

    const altCm = payload[10] | (payload[11] << 8)
    const speedRaw = payload[12] | (payload[13] << 8)

    const alt = altCm > 32767 ? altCm - 65536 : altCm
    const speed = (speedRaw > 32767 ? speedRaw - 65536 : speedRaw) / 100

    const hdop = (payload[16] | (payload[17] << 8)) / 100
     
    if (  fixType >= 2 &&  lat !== 0 && lon !== 0 && currentIsArmed ) {  updateLiveTrail(lat, lon)}
    
    setGpsData(lat, lon, alt / 100, speed, numSat, hdop)
    updateGpsOverlay(lat, lon, alt / 100, speed, fixType, numSat, hdop, currentHeading)
    updateDistanceToHome(lat, lon, homeLat, homeLon)
    updateHomeArrow(lat, lon, homeLat, homeLon)
  }

  /* ================= BASIC STATUS ================= */

  if (cmd === 101 && payload.length >= 11) {

    const read32 = (o: number) =>
      payload[o] |
      (payload[o + 1] << 8) |
      (payload[o + 2] << 16) |
      (payload[o + 3] << 24)

    const flags = read32(6)

    const armed = (flags & (1 << 0)) !== 0
    const angle = (flags & (1 << 3)) !== 0

    setArmed(armed)
    setAngleMode(angle)

    updateArmedStatus(armed)
    refreshFlightModeUI(currentNavMode, angle)

     

    if (armed) {
      hideFooter()
    }
  }
}

/* ========================================================= */

function handleMSPv2Response(_cmd: number, _payload: number[]) {
  // Future extension
}

/* ========================================================= */

function read32Signed(arr: number[], index: number): number {

  let value =
    arr[index] |
    (arr[index + 1] << 8) |
    (arr[index + 2] << 16) |
    (arr[index + 3] << 24)

  if (value & 0x80000000) {
    value = value - 0x100000000
  }

  return value
}

function crc8_dvb_s2(crc: number, byte: number): number {

  crc ^= byte

  for (let i = 0; i < 8; i++) {
    if (crc & 0x80) {
      crc = ((crc << 1) ^ 0xD5) & 0xFF
    } else {
      crc = (crc << 1) & 0xFF
    }
  }

  return crc
}