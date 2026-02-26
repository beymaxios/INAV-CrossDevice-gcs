import type { MissionType, ActionType } from '../core/types'
import { mission, markers, renumber } from './missionState'
import { createIcon, updatePolyline } from './missionMap'
import { validateMission } from '../validation/missionValidator'

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

  container.innerHTML = mission.map((m, index) => `
    <div class="wp-row">

      <div class="wp-header">
        <strong>#${m.id}</strong>
        <button data-index="${index}" class="delete-btn">✕</button>
      </div>
      
      <label>Type</label>
      <select data-index="${index}" class="type-select">
        <option value="WAYPOINT" ${m.type === 'WAYPOINT' ? 'selected' : ''}>WAYPOINT</option>
        <option value="PH_TIME" ${m.type === 'PH_TIME' ? 'selected' : ''}>PH_TIME</option>
        <option value="POI" ${m.type === 'POI' ? 'selected' : ''}>POI</option>
        <option value="LAND" ${m.type === 'LAND' ? 'selected' : ''}>LAND</option>
      </select>

      <label>Altitude (m)</label>
      <input type="number" value="${m.alt}" data-index="${index}" class="alt-input"/>

      ${m.type === 'WAYPOINT' ? `
        <label>Speed (m/s)</label>
        <input type="number" value="${m.speed}" data-index="${index}" class="speed-input"/>
      ` : ''}

      ${m.type === 'PH_TIME' ? `
        <label>Hold Time (sec)</label>
        <input type="number" value="${m.waitTime}" data-index="${index}" class="wait-input"/>
      ` : ''}

      <div class="action-section">
        ${
          m.action
            ? `
            <div class="action-label-row">
              <span>Action</span>
              <span>P1</span>
              <span>P2</span>
              <span></span>
            </div>
            <div class="action-row">
              <select class="action-type" data-index="${index}">
                <option value="SET_HEAD" ${m.action.type === 'SET_HEAD' ? 'selected' : ''}>SET_HEAD</option>
                <option value="JUMP" ${m.action.type === 'JUMP' ? 'selected' : ''}>JUMP</option>
                <option value="RTH" ${m.action.type === 'RTH' ? 'selected' : ''}>RTH</option>
              </select>

              <input type="number" class="action-p1" data-index="${index}" value="${m.action.p1}" placeholder="P1"/>
              <input type="number" class="action-p2" data-index="${index}" value="${m.action.p2}" placeholder="P2"/>

              <button class="remove-action" data-index="${index}">
                ✕
              </button>
            </div>
            `
            : `
            <button class="add-action" data-index="${index}">
              + Add Action
            </button>
            `
        }
      </div>

    </div>
  `).join('')

  attachListeners()
  renderValidation()
  refreshIcons()
}

/* =========================
   LISTENERS
========================= */

function attachListeners() {

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission.splice(i, 1)
      markers[i].remove()
      markers.splice(i, 1)
      renumber()
      updatePolyline()
      renderMissionList()
    })
  })

  document.querySelectorAll('.type-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].type = (e.target as HTMLSelectElement).value as MissionType
      renderMissionList()
    })
  })

  document.querySelectorAll('.alt-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].alt = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  document.querySelectorAll('.speed-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].speed = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  document.querySelectorAll('.wait-input').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].waitTime = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  document.querySelectorAll('.add-action').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].action = { type: 'SET_HEAD', p1: 0, p2: 0 }
      renderMissionList()
    })
  })

  document.querySelectorAll('.remove-action').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      mission[i].action = null
      renderMissionList()
    })
  })

  document.querySelectorAll('.action-type').forEach(sel => {
    sel.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      if (mission[i].action)
        mission[i].action!.type = (e.target as HTMLSelectElement).value as ActionType
    })
  })

  document.querySelectorAll('.action-p1').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      if (mission[i].action)
        mission[i].action!.p1 = parseFloat((e.target as HTMLInputElement).value)
    })
  })

  document.querySelectorAll('.action-p2').forEach(inp => {
    inp.addEventListener('change', e => {
      const i = Number((e.target as HTMLElement).dataset.index)
      if (mission[i].action)
        mission[i].action!.p2 = parseFloat((e.target as HTMLInputElement).value)
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