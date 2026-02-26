export function initLogUI() {

  const toggle = document.getElementById("toggle-log")
  if (!toggle) return

  toggle.addEventListener("click", (e) => {
    e.preventDefault()

    const panel = document.getElementById("log-panel")!
    panel.classList.toggle("collapsed")

    toggle.innerText =
      panel.classList.contains("collapsed")
        ? "Show Log"
        : "Hide Log"
  })
}

/* =========================
   LOG MESSAGE
========================= */

export function logMessage(
  message: string,
  type: "info" | "warn" | "error" = "info"
) {

  const logContent = document.getElementById("log-content")
  const logPreview = document.getElementById("log-preview")

  if (!logContent || !logPreview) return

  const time = new Date().toLocaleTimeString()
  const formatted = `[${time}] ${message}`

  const entry = document.createElement("div")
  entry.className = `log-entry ${type}`
  entry.innerText = formatted

  logContent.appendChild(entry)
  logContent.scrollTop = logContent.scrollHeight

  logPreview.innerText = formatted
  logPreview.className = `log-preview ${type}`
}