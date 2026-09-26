import { DEFAULT_TICKET_DATA } from '@/data/defaults.js'

// Claves cortas (1-2 caracteres) en un formato compacto para minimizar el
// payload del QR. Para un ticket pequeño, la compresión LZ empeora el tamaño
// (añade cabecera), así que conviene acortar claves.
// Formato interno: "c*20~r*1768...~n*014..." (campo separado por ~, clave*valor).
// El payload completo se URL-encodea al montar la URL del QR para preservar
// tildes, eñes y caracteres especiales sin depender de la codificación del lector.
const KEY_MAP = {
  // Datos fijos del ticket (deben viajar en el QR para reconstruirlo exactamente)
  empresa1: 'e1',
  empresa2: 'e2',
  contribuyenteEspecial: 'ce',
  matriz1: 'm1',
  matriz2: 'm2',
  encabezado: 'h',
  subtitulo: 'st',
  responsable: 're',
  cargo: 'ca',
  // Datos variables del ticket
  caseta: 'c',
  rucEmisor: 'r',
  numeroTicket: 'n',
  fechaEmision: 'f',
  reciboCaja: 'b',
  codigoBarras: 'k',
  numeroContrato: 'nc',
  proyectoDetalle: 'p',
  placa: 'l',
  numero: 'u',
  cliente: 'm',
  rucCiCliente: 'i',
  telefono: 'e',
  direccion: 'd',
  cantidad: 'q',
  descripcion: 's',
  precioUnitario: 'x',
  costo: 'o',
}

export function encodeTicket(ticketData) {
  const parts = []
  for (const key of Object.keys(DEFAULT_TICKET_DATA)) {
    const short = KEY_MAP[key]
    if (!short) continue // copias/costoManual no son necesarios para reconstruir el ticket
    const value = ticketData[key]
    if (value === '' || value === null || value === undefined) continue
    parts.push(`${short}*${value}`)
  }
  return parts.join('~')
}

export function decodeTicket(param) {
  const out = {}
  const reverse = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]))
  for (const part of String(param).split('~')) {
    const sep = part.indexOf('*')
    if (sep < 0) continue
    const short = part.slice(0, sep)
    const long = reverse[short]
    if (long) out[long] = part.slice(sep + 1)
  }
  return out
}

// El QR siempre apunta a esta misma aplicación (visor), nunca a una URL externa,
// para que al escanearlo se reconstruya y muestre el ticket.
export function resolveQrBase() {
  if (typeof location !== 'undefined') return `${location.origin}${location.pathname}`
  return ''
}

export function buildQrValue(ticketData) {
  const payload = encodeTicket(ticketData)
  const base = resolveQrBase()
  const sep = base.includes('?') ? '&' : '?'
  // URL-encodeamos el payload para que tildes, eñes y caracteres como & = # ?
  // no se corrompan al escanear el QR con diferentes lectores o navegadores.
  return `${base}${sep}ticket=${encodeURIComponent(payload)}`
}

export function readTicketParam() {
  if (typeof location === 'undefined') return null
  const param = new URLSearchParams(location.search).get('ticket')
  if (!param) return null
  try {
    return decodeTicket(param)
  } catch (error) {
    console.warn('[ticket-generator] QR de ticket inválido.', error)
    return null
  }
}
