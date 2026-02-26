import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

import type { MissionItem } from '../core/types'
import { mission, markers, polyline, setPolyline } from './missionState'

/* ========================================================= */

export const homeLatLng = L.latLng(23.0645, 70.1189)

export let map: L.Map

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

  /* ================= HOME MARKER ================= */

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

  L.marker(homeLatLng, { icon: homeIcon })
    .addTo(map)
    .bindPopup("HOME")
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

export function enableMapClick(handler: (lat: number, lon: number) => void) {

  map.on('click', (e) => {
    handler(e.latlng.lat, e.latlng.lng)
  })
}