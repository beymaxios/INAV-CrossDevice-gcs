import { serialTransport } from '../transport/serialTransport'
import { websocketTransport } from '../transport/websocketTransport'
import { resetTelemetry } from './telemetryUI'
import { setActiveTransport } from '../transport/transportManager'
import { setFcButtonsEnabled } from './layout'
/* =========================================================
   CONNECTION UI
========================================================= */

let isConnected = false
let activeTransport = serialTransport

export function initConnectionUI() {

  const button = document.getElementById("connect-btn")
  const selector = document.getElementById("transport-select") as HTMLSelectElement

  if (!button || !selector) return

  /* ================= TRANSPORT SELECTION ================= */

  selector.addEventListener("change", () => {

    if (isConnected) return   // prevent switching while connected

    if (selector.value === "serial") {
      activeTransport = serialTransport
    } else {
      activeTransport = websocketTransport
    }
  })

  /* ================= CONNECT BUTTON ================= */

  button.addEventListener("click", async () => {

    if (!isConnected) {

      try {
        await activeTransport.connect()
        isConnected = true
        updateButton(true)
        setActiveTransport(activeTransport) 
      } catch (err) {
        console.error(err)
      }

    } else {

      await activeTransport.disconnect()
      isConnected = false
      updateButton(false)
      resetTelemetry()
    }
  })
}

/* ========================================================= */

function updateButton(state: boolean) {

  const status = document.getElementById("connection-status")
  const button = document.getElementById("connect-btn")

  if (!status || !button) return

  if (state) {
    setFcButtonsEnabled(true)
    status.classList.remove("disconnected")
    status.classList.add("connected")

    button.classList.add("disconnect")
    button.innerHTML = `<i class="fa-solid fa-plug-circle-xmark"></i>`

  } else {
    setFcButtonsEnabled(false)
    status.classList.remove("connected")
    status.classList.add("disconnected")

    button.classList.remove("disconnect")
    button.innerHTML = `<i class="fa-solid fa-plug"></i>`
  }
}