import { computed } from 'vue'
import { useSettings } from './useSettings.js'
import { useTicket } from './useTicket.js'

const { settings } = useSettings()
const { ticket, pdfTickets } = useTicket()

// Dimensiones de la hoja A4 vertical en mm.
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297

export function usePrintLayout() {
  // Los tickets inician pegados al borde superior e izquierdo de la hoja (sin
  // margen en esos lados) para facilitar el corte; el margen solo se aplica a la
  // derecha e inferior, donde el sello de la impresora lo requiere.
  const usableWidth = computed(() => A4_WIDTH_MM - Number(settings.printMarginMm || 0))
  const usableHeight = computed(() => A4_HEIGHT_MM - Number(settings.printMarginMm || 0))

  const columns = computed(() =>
    Math.max(
      1,
      Math.floor(
        (usableWidth.value + Number(settings.printGapMm || 0)) /
          (Number(settings.ticketWidthMm) + Number(settings.printGapMm || 0)),
      ),
    ),
  )

  const rows = computed(() =>
    Math.max(
      1,
      Math.floor(
        (usableHeight.value + Number(settings.printGapMm || 0)) /
          (Number(settings.ticketHeightMm) + Number(settings.printGapMm || 0)),
      ),
    ),
  )

  const ticketsPerPage = computed(() => columns.value * rows.value)

  const sourceTickets = computed(() =>
    pdfTickets.value.length ? pdfTickets.value : [{ ...ticket, id: 'draft-ticket' }],
  )

  const printTickets = computed(() => {
    const expanded = []
    for (const sourceTicket of sourceTickets.value) {
      const copies = Math.max(1, Math.floor(Number(sourceTicket.copias) || 1))
      for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
        expanded.push({
          ...sourceTicket,
          printId: `${sourceTicket.id || sourceTicket.numeroTicket || 'ticket'}-${copyIndex + 1}`,
          printCopyIndex: copyIndex + 1,
          printCopyCount: copies,
        })
      }
    }
    return expanded
  })

  // Validación previa: el ticket debe caber dentro del área útil de la hoja.
  const fitErrors = computed(() => {
    const errors = []
    const w = Number(settings.ticketWidthMm)
    const h = Number(settings.ticketHeightMm)
    const margin = Number(settings.printMarginMm || 0)
    if (!(w > 0)) errors.push('El ancho del ticket debe ser mayor que 0 mm.')
    if (!(h > 0)) errors.push('El alto del ticket debe ser mayor que 0 mm.')
      if (w > usableWidth.value) {
        errors.push(
          `El ancho del ticket (${w} mm) supera el ancho útil de la hoja A4 (${usableWidth.value} mm). Reduce el ancho del ticket o el margen de impresión (actual: ${margin} mm en el lado derecho).`,
        )
      }
      if (h > usableHeight.value) {
        errors.push(
          `El alto del ticket (${h} mm) supera el alto útil de la hoja A4 (${usableHeight.value} mm). Reduce el alto del ticket o el margen de impresión (actual: ${margin} mm en la parte inferior).`,
        )
      }
    return errors
  })

  const fitsOnA4 = computed(() => fitErrors.value.length === 0)

  const copias = computed(() => printTickets.value.length)

  const ticketsRegistrados = computed(() => sourceTickets.value.length)

  const sheetsCount = computed(() => Math.ceil(copias.value / ticketsPerPage.value))

  // Páginas A4: cada página contiene hasta ticketsPerPage copias completas.
  const pages = computed(() => {
    const result = []
    for (let s = 0; s < sheetsCount.value; s += 1) {
      const start = s * ticketsPerPage.value
      const end = Math.min(start + ticketsPerPage.value, copias.value)
      const page = []
      for (let i = start; i < end; i += 1) page.push(i)
      result.push(page.map((index) => printTickets.value[index]))
    }
    return result
  })

  return {
    usableWidth,
    usableHeight,
    columns,
    rows,
    ticketsPerPage,
    fitsOnA4,
    fitErrors,
    copias,
    ticketsRegistrados,
    sheetsCount,
    printTickets,
    pages,
  }
}
