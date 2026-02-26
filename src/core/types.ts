export type MissionType = 'WAYPOINT' | 'PH_TIME' | 'POI' | 'LAND'
export type ActionType = 'SET_HEAD' | 'JUMP' | 'RTH'

export interface MissionAction {
  type: ActionType
  p1: number
  p2: number
}

export interface MissionItem {
  id: number
  lat: number
  lon: number
  alt: number
  type: MissionType
  waitTime: number
  speed: number
  action?: MissionAction | null
}