import { parseMSPStream } from '../core/mspParser'
import { buildMSP } from '../core/msp'
import { logMessage } from '../ui/logUI'
import {
  pollCycle,
  incrementPollCycle,
  setLoraSendTime
} from '../core/telemetryState'

let socket: WebSocket | null = null
let isConnected = false
let telemetryTimer: number | null = null

// Dedicated timestamp for MSP 150 only
let last150SendTime = 0

/* =========================================================
   CONNECT
========================================================= */

export async function connectWebSocket() {

  return new Promise<void>((resolve, reject) => {

    // 🔥 Dynamic host (VERY IMPORTANT)
    const wsUrl = `ws://${location.host}/ws`

    logMessage(`Connecting to ${wsUrl}`)

    socket = new WebSocket(wsUrl)
    socket.binaryType = 'arraybuffer'

    socket.onopen = () => {

      isConnected = true
      logMessage("WebSocket connected")

      // Handshake
      sendMSP(1)

      startPolling()

      resolve()
    }

    socket.onerror = (err) => {
      logMessage("WebSocket error", "error")
      reject(err)
    }

    socket.onclose = () => {
      isConnected = false
      logMessage("WebSocket disconnected")
    }

    socket.onmessage = (event) => {
      const data = new Uint8Array(event.data)
      parseMSPStream(data)
    }
  })
}

/* =========================================================
   DISCONNECT
========================================================= */

export async function disconnectWebSocket() {

  isConnected = false

  if (telemetryTimer) {
    clearTimeout(telemetryTimer)
    telemetryTimer = null
  }

  if (socket) {
    socket.close()
    socket = null
  }

  logMessage("WebSocket disconnected")
}

/* =========================================================
   SEND MSP
========================================================= */

function sendMSP(command: number, payload: number[] = []) {

  if (!socket || socket.readyState !== WebSocket.OPEN) return

  const packet = buildMSP(command, payload)
  socket.send(packet)
}

/* =========================================================
   POLLING LOOP
========================================================= */

function startPolling() {

  function loop() {

    if (!isConnected) return

    switch (pollCycle % 6) {

      case 0:
        sendMSP(121)
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
        // Measure latency only for MSP 150
        last150SendTime = performance.now()
        setLoraSendTime(last150SendTime)
        sendMSP(150)
        break
    }

    incrementPollCycle()

    telemetryTimer = window.setTimeout(loop, 100)
  }

  loop()
}

/* ========================================================= */

export function sendWebSocket(data: Uint8Array) {
  if (socket && isConnected) {
    socket.send(data)
  }
}

/* ========================================================= */

export const websocketTransport = {
  connect: connectWebSocket,
  disconnect: disconnectWebSocket,
  send: sendWebSocket
}