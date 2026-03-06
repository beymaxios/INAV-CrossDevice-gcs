import { clearAllMarkers, map } from "../mission/missionMap";
import { saveMissionToFile, loadMissionFromFile } from "../mission/missionFile"
import { mission } from "../mission/missionState"
import { updatePolyline } from "../mission/missionMap"
export function renderLayout() {

  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  app.innerHTML = `
<header class="topbar">
<div class="left-group">
    <button id="sidebar-toggle" style="background:none; border:none; color:white; font-size:22px; margin-right:10px; cursor:pointer;"> ☰ </button>

  <div class="brand">
    <img src="/logo.png" class="brand-logo" />
    <div class="brand-text">
      <span class="brand-title">INAV</span>
      <span class="brand-sub">WEB GROUND CONTROL STATION</span>
    </div>
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
        <span id="stat-lora">--</span>
      </div>
      <div class="telemetry-label">Serial Link</div>
    </div>

  </div>

  <div class="connection-group">
    <select id="transport-select" class="transport-select">
       <option value="serial">USB</option>
       <option value="websocket">WiFi</option>
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
    <div class="mission-toolbar">
      <button id="saveFileBtn" title="Save Mission to File">
        <i class="fa-solid fa-file-arrow-down"></i>
      </button>

      <button id="loadFileBtn" title="Load Mission from File">
        <i class="fa-solid fa-file-arrow-up"></i>
      </button>

      <button id="uploadFcBtn" class="fc-action" title="Upload Mission to FC">
        <i class="fa-solid fa-cloud-arrow-up"></i>
      </button>

      <button id="fetchFcBtn" class="fc-action" title="Fetch Mission from FC">
        <i class="fa-solid fa-cloud-arrow-down"></i>
      </button>

      <button id="saveEepromBtn" class="fc-action" title="Save Mission to EEPROM">
        <i class="fa-solid fa-microchip"></i>
      </button>

      <button id="loadEepromBtn" class="fc-action" title="Load Mission from EEPROM">
        <i class="fa-solid fa-database"></i>
      </button>
      <button id="clearMissionBtn" title="Clear Mission (UI Only)">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
        <div class="sidebar-scroll">
          <div class="map-hint" id="map-hint">
            <i class="fa-solid fa-circle-info"></i>
            Click on the map to add waypoints
          </div>

           <div id="waypoint-list"></div>
          <div id="validation-area"></div>

        </div>
  </div>
   <div id="splitter"></div>

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

 </div> 
  <div id="gcs-toast-container"></div>
  <div id="status-footer" class="status-footer hidden"></div>

    <div id="confirm-modal" class="confirm-modal hidden">
    <div class="confirm-box">
      <div class="confirm-title">Clear Mission</div>
      <div class="confirm-text">
        This will remove all waypoints from the map.<br/>
        This action cannot be undone.
      </div>
      <div class="confirm-actions">
        <button id="confirm-cancel">Cancel</button>
        <button id="confirm-ok" class="danger">Clear</button>
      </div>
    </div>
  </div>
`


const sidebar = document.getElementById("sidebar")
 const toggleBtn = document.getElementById("sidebar-toggle")
 const container = document.querySelector(".split-container");

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    if (container?.classList.contains("collapsed")) { sidebar?.style.removeProperty("width");}
    container?.classList.toggle("collapsed");

    requestAnimationFrame(() => {  setTimeout(() => map.invalidateSize(), 300);});
  });
}




document.getElementById("saveFileBtn")?.addEventListener("click", saveMissionToFile)
document.getElementById("loadFileBtn")?.addEventListener("click", loadMissionFromFile)
document.getElementById("clearMissionBtn") ?.addEventListener("click", showClearConfirm)
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("confirm-modal")
        ?.classList.add("hidden")
    }
  })

}


function showClearConfirm() {

  const modal = document.getElementById("confirm-modal")
  modal?.classList.remove("hidden")

  document.getElementById("confirm-cancel")!.onclick = () => {
    modal?.classList.add("hidden")
  }

  document.getElementById("confirm-ok")!.onclick = () => {
    modal?.classList.add("hidden")
    clearMissionUI()
  }
}

function clearMissionUI() {

  mission.length = 0

  const list = document.getElementById("waypoint-list")
  if (list) list.innerHTML = ""

  updatePolyline()  
  clearAllMarkers();  
}

export function setFcButtonsEnabled(enabled: boolean) {

  document.querySelectorAll<HTMLButtonElement>(".fc-action")
    .forEach(btn => {
      btn.disabled = !enabled
      btn.classList.toggle("disabled-btn", !enabled)
    })
}