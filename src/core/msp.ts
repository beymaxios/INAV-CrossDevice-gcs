/* =========================================================
   MSP PACKET BUILDER
========================================================= */

/* =========================
   MSP v1
========================= */

export function buildMSP(command: number, payload: number[] = []): Uint8Array {

  const size = payload.length
  let checksum = size ^ command

  const buffer = new Uint8Array(6 + size)

  buffer[0] = 36   // '$'
  buffer[1] = 77   // 'M'
  buffer[2] = 60   // '<'
  buffer[3] = size
  buffer[4] = command

  for (let i = 0; i < size; i++) {
    buffer[5 + i] = payload[i]
    checksum ^= payload[i]
  }

  buffer[5 + size] = checksum
 
  return buffer
}

/* =========================
   MSP v2
========================= */

export function buildMSPv2(command: number, payload: number[] = []): Uint8Array {

  const size = payload.length
  const buffer = new Uint8Array(9 + size)

  buffer[0] = 36   // '$'
  buffer[1] = 88   // 'X'
  buffer[2] = 60   // '<'
  buffer[3] = 0    // flags

  buffer[4] = command & 0xFF
  buffer[5] = (command >> 8) & 0xFF

  buffer[6] = size & 0xFF
  buffer[7] = (size >> 8) & 0xFF

  for (let i = 0; i < size; i++) {
    buffer[8 + i] = payload[i]
  }

  const crcData = Array.from(buffer.slice(3, 8 + size))
  buffer[8 + size] = crc8DvbS2(crcData)

  return buffer
}


/* =========================================================
   CRC8 DVB-S2
========================================================= */


function crc8DvbS2(data: number[]): number {

  let crc = 0

  for (let byte of data) {
    crc ^= byte

    for (let i = 0; i < 8; i++) {
      if (crc & 0x80) {
        crc = ((crc << 1) ^ 0xD5) & 0xFF
      } else {
        crc = (crc << 1) & 0xFF
      }
    }
  }

  return crc
}