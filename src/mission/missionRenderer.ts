import type { MissionType } from '../core/types'
import { mission, markers, renumber } from './missionState'
import { createIcon, updatePolyline } from './missionMap'
import { validateMission } from '../validation/missionValidator'

/* =========================
   ICON REFRESH
========================= */

export function refreshIcons() {
  markers.forEach((marker, i) => {
    if (mission[i]) {
      marker.setIcon(createIcon(mission[i]))
    }
  })
}

/* =========================
   RENDER
========================= */

export function renderMissionList() {

  const container = document.getElementById('waypoint-list')
  if (!container) return

  if (!mission.length) {
    container.innerHTML = 'No mission items yet'
    return
  }

  container.innerHTML = mission.map((m, index) => {

    return `
      <div class="wp-row">

        <div class="wp-header">
          <strong>#${m.id}</strong>
          <button data-index="${index}" class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <div class="wp-field">
          <label>Type</label>
          <select data-index="${index}" class="type-select">
            ${renderTypeOptions(m.type)}
          </select>
        </div>

        <div class="wp-field">
          <label>Altitude (cm)</label>
          <input type="number"
            value="${m.alt}"
            data-index="${index}"
            class="alt-input"/>
        </div>

        ${renderTypeSpecificFields(m, index)}

      </div>
    `
  }).join('')

  attachListeners()
  renderValidation()
  refreshIcons()
  updateMapHint()
}

function updateMapHint() {
  const hint = document.getElementById('map-hint')
  if (!hint) return

  hint.style.display = mission.length === 0 ? 'flex' : 'none'
}
/* =========================
   TYPE OPTIONS
========================= */

function renderTypeOptions(selected: MissionType) {

  const types: MissionType[] = [
    "WAYPOINT",
    "PH_TIME",
    "POI",
    "LAND",
    "SET_HEAD",
    "JUMP",
    "RTH"
  ]

  return types.map(t =>
    `<option value="${t}" ${t === selected ? 'selected' : ''}>${t}</option>`
  ).join('')
}

/* =========================
   TYPE-SPECIFIC FIELDS
========================= */

function renderTypeSpecificFields(m: any, index: number) {

  switch (m.type) {

    case "WAYPOINT":
      return `
        <div class="wp-field">
          <label>Speed (cm/s)</label>
          <input type="number"
            value="${m.p1}"
            data-index="${index}"
            class="p1-input"/>
        </div>

        <div class="wp-field">
          <label>Level Ref (flag)</label>
          <input type="number"
            value="${m.flag}"
            data-index="${index}"
            class="flag-input"/>
        </div>
      `

    case "PH_TIME":
      return `
        <div class="wp-field">
          <label>Hold Time (sec)</label>
          <input type="number"
            value="${m.p1}"
            data-index="${index}"
            class="p1-input"/>
        </div>
      `

    case "SET_HEAD":
      return `
        <div class="wp-field">
          <label>Heading (deg)</label>
          <input type="number"
            value="${m.p1}"
            data-index="${index}"
            class="p1-input"/>
        </div>
      `

    case "JUMP":
      return `
        <div class="wp-field">
          <label>Jump Target WP</label>
          <input type="number"
            value="${m.p1}"
            data-index="${index}"
            class="p1-input"/>
        </div>

        <div class="wp-field">
          <label>Repeat Count (255 = infinite)</label>
          <input type="number"
            value="${m.p2}"
            data-index="${index}"
            class="p2-input"/>
        </div>
      `

    case "POI":
      return `
        <div class="wp-field">
          <label>POI Param 1</label>
          <input type="number"
            value="${m.p1}"
            data-index="${index}"
            class="p1-input"/>
        </div>

        <div class="wp-field">
          <label>POI Param 2</label>
          <input type="number"
            value="${m.p2}"
            data-index="${index}"
            class="p2-input"/>
        </div>

        <div class="wp-field">
          <label>POI Param 3</label>
          <input type="number"
            value="${m.p3}"
            data-index="${index}"
            class="p3-input"/>
        </div>
      `

    case "RTH":
    case "LAND":
      return `<div class="wp-field"><em>No parameters</em></div>`

    default:
      return ''
  }
}

/* =========================
   LISTENERS
========================= */

function attachListeners() {

  // DELETE
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {

      const index = Number((e.currentTarget as HTMLElement).dataset.index)
      if (isNaN(index)) return

      const marker = markers[index]
      if (marker) {
        marker.remove()
        markers.splice(index, 1)
      }

      mission.splice(index, 1)

      renumber()
      updatePolyline()
      renderMissionList()
    })
  })

  // TYPE CHANGE
  document.querySelectorAll('.type-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].type = (e.target as HTMLSelectElement).value as MissionType
      renderMissionList()
    })
  })

  // ALT
  document.querySelectorAll('.alt-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].alt = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  // P1
  document.querySelectorAll('.p1-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].p1 = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  // P2
  document.querySelectorAll('.p2-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].p2 = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  // P3
  document.querySelectorAll('.p3-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].p3 = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  // FLAG
  document.querySelectorAll('.flag-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].flag = parseFloat((e.target as HTMLInputElement).value)
    })
  })
}

/* =========================
   VALIDATION
========================= */

function renderValidation() {

  const box = document.getElementById('validation-area')
  if (!box) return

  const errors = validateMission()

  box.innerHTML = errors.length
    ? `
      <div class="validation-box">
        <strong>Mission Errors:</strong><br/>
        ${errors.map(e => `• ${e}`).join('<br/>')}
      </div>
    `
    : ''
}