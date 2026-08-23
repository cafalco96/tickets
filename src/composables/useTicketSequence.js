import { computed } from 'vue'
import { useSettings } from './useSettings.js'

const { settings } = useSettings()

// Formatea una secuencia numérica con ceros a la izquierda según la configuración.
function formatSequence(sequence) {
  const digits = Math.max(1, Number(settings.ticketSequenceDigits) || 1)
  const seq = Math.max(0, Math.floor(Number(sequence) || 0))
  return String(seq).padStart(digits, '0')
}

export function useTicketSequence() {
  // Número completo del próximo ticket: {prefijo}{secuencia rellenada}.
  const nextTicketNumber = computed(
    () => `${settings.ticketPrefix}${formatSequence(settings.nextTicketSequence)}`,
  )

  // Toma el próximo correlativo como número de ticket.
  // consume=true incrementa y persiste el siguiente número.
  function generateTicketNumber({ consume = true } = {}) {
    const numero = nextTicketNumber.value
    if (consume) {
      settings.nextTicketSequence = Math.floor(Number(settings.nextTicketSequence) || 0) + 1
    }
    return numero
  }

  // Incremento explícito usado por la política "imprimir".
  function incrementSequence() {
    settings.nextTicketSequence = Math.floor(Number(settings.nextTicketSequence) || 0) + 1
  }

  // Fija manualmente el próximo correlativo (cambio de equipo, rangos, etc.).
  function setNextSequence(value) {
    const parsed = Math.floor(Number(value))
    if (!Number.isFinite(parsed) || parsed < 0) return false
    settings.nextTicketSequence = parsed
    return true
  }

  // Extrae la parte numérica (secuencia) de un número de ticket completo.
  function parseSequenceFromNumber(numeroTicket) {
    const text = String(numeroTicket || '').trim()
    if (!text) return null
    let rest = text
    if (settings.ticketPrefix && text.startsWith(settings.ticketPrefix)) {
      rest = text.slice(settings.ticketPrefix.length)
    }
    const match = rest.match(/(\d+)\s*$/)
    if (!match) return null
    const seq = Number.parseInt(match[1], 10)
    return Number.isFinite(seq) ? seq : null
  }

  return {
    nextTicketNumber,
    formatSequence,
    generateTicketNumber,
    incrementSequence,
    setNextSequence,
    parseSequenceFromNumber,
  }
}
