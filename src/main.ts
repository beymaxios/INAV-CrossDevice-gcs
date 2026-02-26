import './style.css'

import { renderLayout } from './ui/layout'
import { initLogUI } from './ui/logUI'
import { initConnectionUI } from './ui/connectionUI'

import { initMap, enableMapClick, addMarker, updatePolyline } from './mission/missionMap'
import { mission } from './mission/missionState'
import { renderMissionList } from './mission/missionRenderer'

/* =========================================================
   APP BOOTSTRAP
========================================================= */

renderLayout()

initMap()   // 🔥 THIS WAS MISSING

initLogUI()
initConnectionUI()

/* =========================================================
   MAP CLICK → ADD MISSION ITEM
========================================================= */

enableMapClick((lat, lon) => {

  const newItem = {
    id: mission.length + 1,
    lat,
    lon,
    alt: 50,
    type: 'WAYPOINT' as const,
    waitTime: 0,
    speed: 5,
    action: null
  }

  const hint = document.getElementById("map-hint")
  if (hint) hint.style.display = "none"

  mission.push(newItem)
  addMarker(newItem)
  updatePolyline()
  renderMissionList()
})