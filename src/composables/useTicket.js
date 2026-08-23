import { reactive, ref, watch } from 'vue'
import { DEFAULT_TICKET_DATA } from '@/data/defaults.js'
import { useSettings } from './useSettings.js'
import { useTicketSequence } from './useTicketSequence.js'

const { settings } = useSettings()
const sequence = useTicketSequence()

// Datos variables del ticket actual. NUNCA se persisten.
const ticket = reactive({ ...DEFAULT_TICKET_DATA })
const pdfTickets = ref([])
const pdfFeedback = ref('')
const pdfFeedbackType = ref('info')

let pdfFeedbackTimer = null

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

// Fecha/hora local en formato DD/MM/YYYY - HH:mm
function formatLocalDateTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${day}/${month}/${year} - ${hours}:${minutes}`
}

export function validationErrorsForTicket(ticketData) {
  const errors = []
  if (!String(ticketData.numeroTicket).trim()) {
    errors.push('El número de ticket está vacío. Use «Nuevo ticket» para generarlo.')
  }
  if (Number(ticketData.cantidad) < 0) errors.push('La cantidad no puede ser negativa.')
  if (Number(ticketData.precioUnitario) < 0) errors.push('El precio unitario no puede ser negativo.')
  if (Number(ticketData.costo) < 0) errors.push('El costo no puede ser negativo.')
  if (!String(ticketData.fechaEmision).trim()) errors.push('La fecha de emisión está vacía.')
  return errors
}

function setPdfFeedback(message, type = 'info') {
  pdfFeedback.value = message
  pdfFeedbackType.value = type
  clearTimeout(pdfFeedbackTimer)
  if (!message) return
  pdfFeedbackTimer = setTimeout(() => {
    pdfFeedback.value = ''
    pdfFeedbackType.value = 'info'
  }, 5000)
}

// Cálculo automático del costo cuando no está en modo manual.
watch(
  () => [ticket.cantidad, ticket.precioUnitario, ticket.costoManual],
  () => {
    if (ticket.costoManual) return
    const cantidad = Number(ticket.cantidad) || 0
    const precio = Number(ticket.precioUnitario) || 0
    ticket.costo = round2(cantidad * precio)
  },
)

export function useTicket() {
  // Crea un ticket nuevo: reinicia datos variables y asigna el correlativo.
  function nuevoTicket() {
    const copiasAnteriores = ticket.copias
    const numeroAnterior = String(ticket.numeroTicket || '').trim()
    Object.assign(ticket, structuredClone(DEFAULT_TICKET_DATA))
    ticket.copias = Math.max(1, Math.floor(Number(copiasAnteriores) || 1))
    ticket.fechaEmision = formatLocalDateTime()
    ticket.costo = round2((Number(ticket.cantidad) || 0) * (Number(ticket.precioUnitario) || 0))
    const consume = settings.incrementarAl === 'nuevo_ticket' || (
      settings.incrementarAl === 'imprimir' && Boolean(numeroAnterior)
    )
    ticket.numeroTicket = sequence.generateTicketNumber({ consume })
  }

  function agregarTicketAlPdf() {
    const validationErrors = validationErrorsForTicket(ticket)
    if (validationErrors.length) {
      setPdfFeedback(`No se pudo agregar el ticket al PDF final: ${validationErrors[0]}`, 'error')
      return { ok: false, errors: validationErrors }
    }

    const snapshot = structuredClone({ ...ticket })
    snapshot.id = `${snapshot.numeroTicket}-${Date.now()}-${pdfTickets.value.length + 1}`
    pdfTickets.value.push(snapshot)
    setPdfFeedback(
      `Ticket ${snapshot.numeroTicket} agregado al PDF final. Lote acumulado: ${pdfTickets.value.length}.`,
      'success',
    )
    nuevoTicket()
    return { ok: true, ticket: snapshot }
  }

  function limpiarPdfFinal() {
    pdfTickets.value = []
    setPdfFeedback('El PDF final se vació. Puede seguir creando tickets desde cero.', 'info')
  }

  function agregarCopia() {
    ticket.copias = Math.min(99, Math.max(1, Math.floor(Number(ticket.copias) || 1)) + 1)
  }

  function quitarCopia() {
    ticket.copias = Math.max(1, Math.floor(Number(ticket.copias) || 1) - 1)
  }

  return {
    ticket,
    nuevoTicket,
    agregarTicketAlPdf,
    limpiarPdfFinal,
    agregarCopia,
    quitarCopia,
    formatLocalDateTime,
    pdfTickets,
    pdfFeedback,
    pdfFeedbackType,
  }
}
