import { logMessage } from '../ui/logUI'

/* =========================================================
   CONNECTION STATE MACHINE
========================================================= */

export const ConnectionState = {
  DISCONNECTED: 0,
  PORT_OPEN: 1,
  HANDSHAKING: 2,
  ACTIVE: 3,
  TIMEOUT: 4
} as const

export type ConnectionStateType =
  typeof ConnectionState[keyof typeof ConnectionState]

let currentState: ConnectionStateType = ConnectionState.DISCONNECTED
let handshakeTimeout: number | null = null

/* ========================================================= */

export function updateConnectionState(state: ConnectionStateType) {

  if (currentState === state) return
  currentState = state

  const badge = document.getElementById("connection-status")
  if (!badge) return

  switch (state) {

    case ConnectionState.DISCONNECTED:
      badge.className = "status-badge disconnected"
      logMessage("Disconnected from FC", "warn")
      break

    case ConnectionState.PORT_OPEN:
      badge.className = "status-badge disconnected"
      logMessage("Port opened")
      break

    case ConnectionState.HANDSHAKING:
      badge.className = "status-badge disconnected"
      logMessage("Sending MSP handshake...")
      break

    case ConnectionState.ACTIVE:
      badge.className = "status-badge connected"
      logMessage("MSP handshake successful")
      break

    case ConnectionState.TIMEOUT:
      badge.className = "status-badge disconnected"
      logMessage("No MSP response received", "error")
      break
  }
}

/* ========================================================= */

export function startHandshakeTimeout(ms: number = 2000) {

  clearHandshakeTimeout()

  handshakeTimeout = window.setTimeout(() => {
    if (currentState !== ConnectionState.ACTIVE) {
      updateConnectionState(ConnectionState.TIMEOUT)
    }
  }, ms)
}

export function clearHandshakeTimeout() {

  if (handshakeTimeout) {
    clearTimeout(handshakeTimeout)
    handshakeTimeout = null
  }
}

export function getConnectionState() {
  return currentState
}