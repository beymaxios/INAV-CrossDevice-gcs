import L from 'leaflet'
import type { MissionItem } from '../core/types'

export let mission: MissionItem[] = []
export let markers: L.Marker[] = []
export let polyline: L.Polyline | null = null

export let quadMarker: L.Marker | null = null
export let mapInitializedFromGPS = false

export let currentHeading = 0

export function renumber() {
  mission.forEach((m, i) => m.id = i + 1)
}

export function setPolyline(value: L.Polyline | null) {
  polyline = value
}

export function resetMissionState() {
  mission.length = 0
  markers.length = 0
  polyline = null
}