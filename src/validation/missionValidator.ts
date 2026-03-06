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

    // ---- Altitude check (not required for JUMP/RTH)
    if (
      m.type !== 'JUMP' &&
      m.type !== 'RTH' &&
      m.alt <= 0
    ) {
      errors.push(`Item ${m.id}: Altitude must be > 0`)
    }

    // ---- LAND must be last
    if (m.type === 'LAND' && index !== mission.length - 1) {
      errors.push(`Item ${m.id}: LAND must be last`)
    }

    // ================= RTH =================
    if (m.type === 'RTH') {

      rthCount++

      if (index === 0) {
        errors.push(`Item ${m.id}: First waypoint cannot be RTH`)
      }

      if (index !== mission.length - 1) {
        errors.push(`Item ${m.id}: RTH should normally be last`)
      }
    }

    // ================= SET_HEAD =================
    if (m.type === 'SET_HEAD') {

      if (m.p1 < 0 || m.p1 > 360) {
        errors.push(`Item ${m.id}: SET_HEAD heading must be 0–360`)
      }
    }

    // ================= JUMP =================
    if (m.type === 'JUMP') {

      const targetWp = m.p1
      const repeat = m.p2

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

  })

  // ---- Only one POI
  if (poiCount > 1) {
    errors.push("Only one POI allowed per mission")
  }

  // ---- Only one RTH
  if (rthCount > 1) {
    errors.push("Only one RTH allowed per mission")
  }

  return errors
}