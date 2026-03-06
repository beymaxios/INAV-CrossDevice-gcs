import { parseMSPStream } from '../core/mspParser'
import { sendMSP } from '../core/mspSender'
import { logMessage } from '../ui/logUI'
import {
  pollCycle,
  incrementPollCycle,
  setLoraSendTime,
  resetTelemetryState
} from '../core/telemetryState'
import { resetTelemetryUI } from '../ui/telemetryUI'

/* =========================================================
   SERIAL TRANSPORT
========================================================= */

let port: SerialPort | null = null
let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
let writer: WritableStreamDefaultWriter<Uint8Array> | null = null

let isConnected = false
let telemetryTimer: number | null = null

/* ========================================================= */

export async function connectSerial() {

  const AndroidUSB = (window as any).AndroidUSB

  /* ------------------------------
     Desktop (WebSerial)
  ------------------------------ */

  if ("serial" in navigator) {
    return connectWebSerial()
  }

  /* ------------------------------
     Android native USB bridge
  ------------------------------ */

  if (AndroidUSB) {

    logMessage("Using Android USB")

    try {
   
          const ok = AndroidUSB.connect()

      if (!ok) {
        logMessage("USB permission or device not ready", "error")
        return
      }

      isConnected = true

      startPolling()
      sendMSP(1)

    } catch (err) {

      console.error(err)
      logMessage("Android USB connection failed", "error")
    }

    return
  }

  alert("USB not supported on this platform.")
}

/* =========================================================
   WEB SERIAL (Desktop)
========================================================= */

async function connectWebSerial() {

  try {

    port = await (navigator as any).serial.requestPort()

    if (!port) {
      logMessage("Failed to request serial port", "error")
      return
    }

    await port.open({ baudRate: 115200 })

    reader = port.readable?.getReader() ?? null
    writer = port.writable?.getWriter() ?? null

    isConnected = true

    logMessage("USB connected")

    startReading()
    startPolling()

    // MSP handshake
    sendMSP(1)

  } catch (err) {

    console.error(err)
    logMessage("Serial connection failed", "error")
    disconnectSerial()
  }
}

/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectSerial() {

  isConnected = false

  if (telemetryTimer) {
    clearTimeout(telemetryTimer)
    telemetryTimer = null
  }

  try {
    reader?.releaseLock()
    writer?.releaseLock()
    await port?.close()
  } catch {}

  reader = null
  writer = null
  port = null

  logMessage("Serial disconnected")

  resetTelemetryState()
  resetTelemetryUI()
}

/* =========================================================
   READ SERIAL DATA
========================================================= */

async function startReading() {

  if (!reader) return

  try {

    while (isConnected) {

      const { value, done } = await reader.read()

      if (done) break

      if (value) parseMSPStream(value)
    }

  } catch (err) {

    console.error(err)
  }

  disconnectSerial()
}


/* =========================================================
   TELEMETRY POLLING
========================================================= */

function startPolling() {

  function loop() {

    if (!isConnected) return

    switch (pollCycle % 6) {

      case 0:
        sendMSP(121)
        sendMSP(108)
        break

      case 1:
        sendMSP(110)
        break

      case 2:
        sendMSP(106)
        break

      case 3:
        sendMSP(101)
        break

      case 4:
        sendMSP(105)
        break

      case 5:
        setLoraSendTime(performance.now())
        sendMSP(150)
        break
    }

    incrementPollCycle()

    telemetryTimer = window.setTimeout(loop, 300)
  }

  loop()
}

/* =========================================================
   TRANSPORT EXPORT
========================================================= */
export const serialTransport = {

  connect: connectSerial,

  disconnect: disconnectSerial,

  send: (data: Uint8Array) => {

    const AndroidUSB = (window as any).AndroidUSB

    /* Desktop WebSerial */
    if (writer) {
      writer.write(data)
      return
    }

    /* Android native USB */
    if (AndroidUSB && typeof AndroidUSB.write === "function") {
      AndroidUSB.write(Array.from(data))
      return
    }
  }
}