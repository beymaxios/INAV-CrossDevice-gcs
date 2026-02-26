export type TransportType = 'serial' | 'websocket'

export interface Transport {
  connect(): Promise<void>
  disconnect(): Promise<void>
  send(data: Uint8Array): void
}

let activeTransport: Transport | null = null

export function setActiveTransport(transport: Transport) {
  activeTransport = transport
}

export function getActiveTransport() {
  return activeTransport
}