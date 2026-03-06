import './style.css'

import { renderLayout } from './ui/layout'
import { initLogUI } from './ui/logUI'
import { initConnectionUI } from './ui/connectionUI'

import { initMap, enableMapClick, addMarker, updatePolyline, map } from './mission/missionMap'
import { mission } from './mission/missionState'
import { renderMissionList } from './mission/missionRenderer'

import { fetchMissionFromFC, uploadMissionToFC } from './mission/missionMSP'
import { sendMSP } from './core/mspSender'
import { parseMSPStream } from './core/mspParser'

/* =========================================================
   APP BOOTSTRAP
========================================================= */

renderLayout()
initMap()   
initLogUI()
initConnectionUI()
initMissionToolbar()

/* =========================================================
   MAP CLICK → ADD MISSION ITEM
========================================================= */

enableMapClick((lat, lon) => {

  const newItem = {
    id: mission.length + 1,
    lat,
    lon,
    alt: 50,
    type: "WAYPOINT" as const,
    p1: 0,
    p2: 0,
    p3: 0,
    flag: 0
  }

  const hint = document.getElementById("map-hint")
  if (hint) hint.style.display = "none"

  mission.push(newItem)
  addMarker(newItem)
  updatePolyline()
  renderMissionList()
})


const sidebar = document.getElementById("sidebar") as HTMLElement;
const splitter = document.getElementById("splitter") as HTMLElement;

let isDragging = false;

function startDrag() {
  isDragging = true;
  document.body.style.cursor = "col-resize";
}

function stopDrag() {
  if (!isDragging) return;

  isDragging = false;
  document.body.style.cursor = "default";

  setTimeout(() => {
    map.invalidateSize();
  }, 50);
}

function onDrag(clientX: number) {
  if (!isDragging) return;

  const minWidth = 180;
  const maxWidth = window.innerWidth * 0.8;

  if (clientX > minWidth && clientX < maxWidth) {
    sidebar.style.width = `${clientX}px`;
  }
}

splitter.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  startDrag();
});

document.addEventListener("pointermove", (e) => {
  if (!isDragging) return;
  onDrag(e.clientX);
});

document.addEventListener("pointerup", stopDrag);



function initMissionToolbar() {

  const fetchBtn = document.getElementById('fetchFcBtn')
  const uploadBtn = document.getElementById('uploadFcBtn')
  const saveEepromBtn = document.getElementById('saveEepromBtn')
  const loadEepromBtn = document.getElementById('loadEepromBtn')

  fetchBtn?.addEventListener('click', fetchMissionFromFC)

  uploadBtn?.addEventListener('click', uploadMissionToFC)

  saveEepromBtn?.addEventListener('click', () => {
    sendMSP(250) // MSP_EEPROM_WRITE
  })

  loadEepromBtn?.addEventListener('click', () => {
    fetchMissionFromFC()
  })

  
}

window.addEventListener("android-usb-data", (event: any) => {

  const data = new Uint8Array(event.detail)

  console.log("ANDROID USB DATA:", data)

  parseMSPStream(data)
})