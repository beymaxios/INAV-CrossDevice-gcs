export function renderLayout() {

  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  app.innerHTML = `
<header class="topbar">

  <div class="brand">
    <img src="/logo.png" class="brand-logo" />
    <div class="brand-text">
      <span class="brand-title">INAV</span>
      <span class="brand-sub">WEB GROUND CONTROL STATION</span>
    </div>
  </div>

  <div class="telemetry-strip">

    <div class="telemetry-item">
      <div class="telemetry-top">
        <i class="fa-solid fa-satellite"></i>
        <span id="stat-sat">0</span>
      </div>
      <div class="telemetry-label">SAT</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <i class="fa-solid fa-compass"></i>
        <span id="stat-hdop">NA</span>
      </div>
      <div class="telemetry-label">HDOP</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <i class="fa-solid fa-battery-half"></i>
        <span id="stat-batt">0.0V</span>
      </div>
      <div class="telemetry-label">BATT</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <i class="fa-solid fa-signal"></i>
        <span id="stat-lq">0%</span>
      </div>
      <div class="telemetry-label">LQ</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <span id="stat-armed">DISARMED</span>
      </div>
      <div class="telemetry-label">ARM</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <span id="stat-mode">MANUAL</span>
      </div>
      <div class="telemetry-label">MODE</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <span id="stat-failsafe">OK</span>
      </div>
      <div class="telemetry-label">FAILSAFE</div>
    </div>

    <div class="telemetry-item">
      <div class="telemetry-top">
        <span id="stat-lora">--</span>
      </div>
      <div class="telemetry-label">Serial Link</div>
    </div>

  </div>

  <div class="connection-group">
    <select id="transport-select" class="transport-select">
       <option value="serial">USB (Direct OTG)</option>
       <option value="websocket">WiFi (ESP32)</option>
    </select>
    <button id="connect-btn" class="connect-btn icon-only">
      <i class="fa-solid fa-plug"></i>
    </button>

    <div id="connection-status" class="status-badge disconnected">
      <span class="status-dot"></span>
    </div>
  </div>

</header>

<div id="log-panel" class="log-panel collapsed">

  <div class="log-bar">
    <div class="log-left">
      <i class="fa-solid fa-terminal log-icon"></i>
      <span id="log-preview" class="log-preview"></span>
    </div>

    <a href="#" id="toggle-log" class="log-toggle">Show Log</a>
  </div>

  <div id="log-content" class="log-content"></div>
</div>

<div class="split-container">

  <div id="sidebar">
    <h3>Mission Planner</h3>

    <div class="map-hint" id="map-hint">
      <i class="fa-solid fa-circle-info"></i>
      Click on the map to add waypoints
    </div>

    <div id="waypoint-list"></div>
    <div id="validation-area"></div>
  </div>

  <div id="map">

    <div id="gps-overlay" class="gps-overlay">

      <div class="gps-row">
        <span>Lat</span>
        <span id="gps-lat">--</span>
      </div>

      <div class="gps-row">
        <span>Lon</span>
        <span id="gps-lon">--</span>
      </div>

      <div class="gps-row">
        <span>Alt</span>
        <span id="gps-alt">--</span>
      </div>

      <div class="gps-row">
        <span>Speed</span>
        <span id="gps-speed">--</span>
      </div>

      <div class="gps-row">
        <span>FIX</span>
        <span id="gps-fix">--</span>
      </div>

      <div class="gps-row">
        <span>Dist. Home</span>
        <span id="gps-dist-home">--</span>
      </div>

      <div class="gps-row">
        <span>Home</span>
        <span>
          <i id="home-dir-icon" class="fa-solid fa-location-arrow home-dir-icon"></i>
        </span>
      </div>

    </div>

  </div>

  <div id="status-footer" class="status-footer hidden"></div>

</div>
`
}

const sidebar = document.getElementById("sidebar")

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement

  if (target.id === "menu-toggle") {
    sidebar?.classList.toggle("open")
  }
})