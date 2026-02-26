import { buildMSP } from './msp'
import { getActiveTransport } from '../transport/transportManager'

export function sendMSP(command: number, payload: number[] = []) {

  const transport = getActiveTransport()
  if (!transport) return

  const packet = buildMSP(command, payload)
  transport.send(packet)
}