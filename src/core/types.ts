export type MissionType =
  | "WAYPOINT"
  | "PH_TIME"
  | "POI"
  | "LAND"
  | "SET_HEAD"
  | "JUMP"
  | "RTH"
  | "SET_POI"

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
  p1: number
  p2: number
  p3: number
  flag: number
}