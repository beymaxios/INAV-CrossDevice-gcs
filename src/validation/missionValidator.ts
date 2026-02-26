import { mission } from '../mission/missionState'

export function validateMission(): string[] {

  const errors: string[] = []

  let rthCount = 0
  let poiCount = 0

  mission.forEach((m, index) => {

    // ---- POI count
    if (m.type === 'POI') {
      poiCount++
    }

    // ---- Altitude check
    if (m.alt <= 0) {
      errors.push(`Item ${m.id}: Altitude must be > 0`)
    }

    // ---- LAND must be last
    if (m.type === 'LAND' && index !== mission.length - 1) {
      errors.push(`Item ${m.id}: LAND must be last`)
    }

    if (m.action) {

      const action = m.action

      // ================= RTH =================
      if (action.type === 'RTH') {

        rthCount++

        if (m.type !== 'WAYPOINT') {
          errors.push(`Item ${m.id}: RTH only allowed on WAYPOINT`)
        }

        if (index === 0) {
          errors.push(`Item ${m.id}: First waypoint cannot have RTH`)
        }
      }

      // ================= SET_HEAD =================
      if (action.type === 'SET_HEAD') {

        if (m.type !== 'WAYPOINT') {
          errors.push(`Item ${m.id}: SET_HEAD only allowed on WAYPOINT`)
        }

        if (action.p1 < 0 || action.p1 > 360) {
          errors.push(`Item ${m.id}: SET_HEAD heading must be 0–360`)
        }
      }

      // ================= JUMP =================
      if (action.type === 'JUMP') {

        if (m.type === 'LAND') {
          errors.push(`Item ${m.id}: JUMP not allowed on LAND`)
        }

        const targetWp = action.p1
        const repeat = action.p2

        if (targetWp < 1 || targetWp > mission.length) {
          errors.push(`Item ${m.id}: JUMP target waypoint invalid`)
        }

        if (targetWp === m.id) {
          errors.push(`Item ${m.id}: JUMP cannot target itself`)
        }

        if (repeat < 1) {
          errors.push(`Item ${m.id}: JUMP repeat must be >= 1`)
        }
      }
    }

  })

  // ---- Only one POI
  if (poiCount > 1) {
    errors.push("Only one POI allowed per mission")
  }

  // ---- Only one RTH
  if (rthCount > 1) {
    errors.push("Only one RTH action allowed per mission")
  }

  return errors
}