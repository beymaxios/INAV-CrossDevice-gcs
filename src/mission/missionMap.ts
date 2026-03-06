import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import type { MissionItem } from '../core/types'
import { mission, markers, polyline, setPolyline } from './missionState'

/* ========================================================= */

export let map: L.Map

const trailCoords: L.LatLngExpression[] = []
let trailLine: L.Polyline | null = null
let quadMarker: L.Marker | null = null
export let quadHeading: number = 0
let homeMarker: L.Marker | null = null


let smoothLat = 0
let smoothLon = 0
let smoothInitialized = false


 const homeIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;
        height:36px;
        background:#00bfff;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        border:2px solid white;
      ">
        <i class="fa-solid fa-house"
           style="color:white;font-size:16px;">
        </i>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  })
/* =========================================================
   INIT MAP
========================================================= */

export function initMap() {

  map = L.map('map', {
    zoomControl: true,
    minZoom: 3,
    maxZoom: 18
  }).setView([20, 78], 5)

  const osmLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { maxZoom: 18 }
  )

  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/' +
    'World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 18,
      attribution: 'Tiles © Esri'
    }
  )

  satelliteLayer.addTo(map)

  L.control.layers(
    {
      "Map": osmLayer,
      "Satellite": satelliteLayer
    },
    {},
    { position: "topleft" }
  ).addTo(map)

  trailLine = L.polyline([], {
    color: '#2248c5',
    weight: 3,
    opacity: 0.9
  }).addTo(map)

  
  /* ================= HOME MARKER ================= */

    window.addEventListener("home-set", (e: any) => {
      const { lat, lon } = e.detail
      setHomeMarker(lat, lon)
    })
}

export function createIcon(item: MissionItem): L.DivIcon {

  let iconClass = 'fa-location-dot'
  let color = '#22c55e'

  if (item.type === 'POI') {
    iconClass = 'fa-crosshairs'
    color = '#3b82f6'
  }

  if (item.type === 'PH_TIME') {
    iconClass = 'fa-clock'
    color = '#f59e0b'
  }

  if (item.type === 'LAND') {
    iconClass = 'fa-plane-arrival'
    color = '#ef4444'
  }

  return L.divIcon({
    className: '',
    html: `
      <div style="
        position:relative;
        width:34px;
        height:34px;
        background:${color};
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        border:2px solid white;
      ">
        <i class="fa-solid ${iconClass}"
           style="color:white;font-size:14px;">
        </i>
        <div style="
          position:absolute;
          bottom:-6px;
          right:-6px;
          width:18px;
          height:18px;
          background:#111;
          color:white;
          font-size:11px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          border:2px solid white;
        ">
          ${item.id}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  })
}
function createQuadIcon(): L.DivIcon {

  return L.divIcon({
    className: '',
    html: `
      <div id="quad-wrapper" class="quad-icon" style="
        width:52px;
        height:52px;
        display:flex;
        align-items:center;
        justify-content:center;
        transition: transform 0.1s linear;
      ">
        <img src="/quad.png"
             style="
               width:48px;
               height:48px;
               pointer-events:none;
               filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6))
               drop-shadow(0 0 8px rgba(59,130,246,0.5));
             " />
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26]
  })
}

export function setQuadStatus(isArmed: boolean,) {

  const wrapper = document.getElementById("quad-wrapper")
  if (!wrapper) return

  wrapper.classList.remove("quad-armed")
  wrapper.classList.remove("quad-failsafe")
 
  if (isArmed) {
    wrapper.classList.add("quad-armed")
  }
}

export function setHomeMarker(lat: number, lon: number) {

  if (!map) return

  if (!homeMarker) {

    homeMarker = L.marker([lat, lon], {
      icon: homeIcon,
      zIndexOffset: 900
    })
      .addTo(map)
      .bindPopup("HOME")

       map.flyTo([lat, lon], 16)
       homeMarker.openPopup()
       setTimeout(() => {
        homeMarker?.closePopup()
      }, 3000)

  } else {
    homeMarker.setLatLng([lat, lon])
  }

}

export function resetHomeMarker() {

  if (homeMarker) {
    map.removeLayer(homeMarker)
    homeMarker = null

  }
  
}

export function updateQuadPosition(lat: number, lon: number,heading: number) {

  if (!map) return

  /* Initialize smoothing */
  if (!smoothInitialized) {
    smoothLat = lat
    smoothLon = lon
    smoothInitialized = true
  }

  /* ===== GPS SMOOTHING ===== */

  const factor = 0.25

  smoothLat += (lat - smoothLat) * factor
  smoothLon += (lon - smoothLon) * factor

  /* ========================= */

  if (!quadMarker) {

    quadMarker = L.marker([smoothLat, smoothLon], {
      icon: createQuadIcon(),
      zIndexOffset: 1000
    }).addTo(map)

  } else {

    quadMarker.setLatLng([smoothLat, smoothLon])

  }

  quadHeading = heading
  rotateQuad()
}

function rotateQuad() {

  const wrapper = document.getElementById("quad-wrapper")

  if (wrapper) {
    wrapper.style.transform = `rotate(${quadHeading}deg)`
  }
}

export function addMarker(item: MissionItem) {

  const marker = L.marker([item.lat, item.lon], {
    draggable: true,
    icon: createIcon(item)
  }).addTo(map)

  marker.on('dragend', (event) => {
    const pos = (event.target as L.Marker).getLatLng()
    item.lat = pos.lat
    item.lon = pos.lng
    updatePolyline()
  })

  markers.push(marker)
}

export function clearAllMarkers() {

  markers.forEach(marker => {
    map.removeLayer(marker)
  })

  markers.length = 0
}

export function clearPolyline() {
  if (polyline) {
    polyline.remove()
    setPolyline(null)
  }
}

export function updatePolyline() {

  if (polyline) {
    polyline.remove()
    setPolyline(null)
  }

  const nonPOI = mission.filter(m => m.type !== 'POI')
  const latlngs = nonPOI.map(m => [m.lat, m.lon]) as L.LatLngExpression[]

  if (latlngs.length > 1) {
    const newLine = L.polyline(latlngs, {
      color: '#ef4444',
      weight: 3
    }).addTo(map)

    setPolyline(newLine)
  }
}

export function updateLiveTrail(lat: number, lon: number) {
  if (!trailLine) return

  trailCoords.push([lat, lon])

  if (trailCoords.length > 500) {
    trailCoords.shift()
  }

  trailLine.setLatLngs(trailCoords)
}

export function enableMapClick(handler: (lat: number, lon: number) => void) {

  map.on('click', (e) => {
    handler(e.latlng.lat, e.latlng.lng)
  })
}

