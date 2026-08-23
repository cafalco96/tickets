<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSettings } from '@/composables/useSettings.js'
import { useTicket } from '@/composables/useTicket.js'
import { useTicketSequence } from '@/composables/useTicketSequence.js'
import { usePrintLayout } from '@/composables/usePrintLayout.js'
import TicketForm from '@/components/TicketForm.vue'
import TicketPreview from '@/components/TicketPreview.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import PrintSheet from '@/components/PrintSheet.vue'

const { settings } = useSettings()
const {
  ticket,
  nuevoTicket,
  agregarTicketAlPdf,
  limpiarPdfFinal,
  agregarCopia,
  quitarCopia,
  pdfTickets,
  pdfFeedback,
  pdfFeedbackType,
} = useTicket()
const sequence = useTicketSequence()
const layout = usePrintLayout()

const ticketOverflow = ref(false)
const qrError = ref('')
const configAbierta = ref(false)
const pdfNoticeClass = computed(() => {
  if (pdfFeedbackType.value === 'success') return 'notice-success'
  if (pdfFeedbackType.value === 'error') return 'notice-error'
  return 'notice-info'
})

// --- Variables CSS físicas inyectadas según la configuración ---
const cssVars = computed(() => ({
  '--ticket-width': `${settings.ticketWidthMm}mm`,
  '--ticket-height': `${settings.ticketHeightMm}mm`,
  '--ticket-padding-top': `${settings.paddingTopMm}mm`,
  '--ticket-padding-right': `${settings.paddingRightMm}mm`,
  '--ticket-padding-bottom': `${settings.paddingBottomMm}mm`,
  '--ticket-padding-left': `${settings.paddingLeftMm}mm`,
  '--print-margin': `${settings.printMarginMm}mm`,
  '--print-gap': `${settings.printGapMm}mm`,
  '--print-columns': String(layout.columns.value),
  '--qr-size': `${settings.qrSizeMm}mm`,
  '--watermark-opacity': String(settings.watermarkOpacity),
  '--ink-intensity': String(settings.intensidadTinta),
  '--texture-intensity': settings.simularTexturaTermica
    ? String(settings.intensidadTexturaTermica)
    : '0',
  '--ticket-font-family': `"${settings.baseFontFamily}", "Ticket Mono", "Courier New", Courier, ui-monospace, "Liberation Mono", monospace`,
  '--ticket-font-size': `${settings.baseFontSizePt}pt`,
  '--ticket-heading-size': `${settings.headingFontSizePt}pt`,
  '--ticket-line-height': String(settings.lineHeight),
  '--ticket-font-weight': String(settings.fontWeight),
}))

// --- Escalado de la previsualización en pantalla (no afecta la impresión) ---
const MM_TO_PX = 96 / 25.4
const scalerEl = ref(null)
const scalerWidth = ref(0)
let resizeObserver = null

const ticketWidthPx = computed(() => Number(settings.ticketWidthMm) * MM_TO_PX)
const ticketHeightPx = computed(() => Number(settings.ticketHeightMm) * MM_TO_PX)

const previewScale = computed(() => {
  if (!scalerWidth.value) return 1
  return Math.min(1, scalerWidth.value / ticketWidthPx.value)
})

const previewBoxStyle = computed(() => ({
  width: `${ticketWidthPx.value * previewScale.value}px`,
  height: `${ticketHeightPx.value * previewScale.value}px`,
}))

const previewFrameStyle = computed(() => ({
  width: `${ticketWidthPx.value}px`,
  height: `${ticketHeightPx.value}px`,
  transform: `scale(${previewScale.value})`,
}))

// --- Impresión ---
function imprimir() {
  if (!layout.fitsOnA4.value) return
  if (!pdfTickets.value.length && settings.incrementarAl === 'imprimir') {
    // El navegador no confirma de forma fiable que la impresión terminó:
    // esto solo registra la intención de imprimir, no una emisión.
    sequence.incrementSequence()
  }
  window.print()
}

function onOverflow(value) {
  ticketOverflow.value = value
}

onMounted(() => {
  if (!String(ticket.numeroTicket).trim()) {
    nuevoTicket()
  }
  if (scalerEl.value) {
    scalerWidth.value = scalerEl.value.clientWidth
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        scalerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(scalerEl.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="app-shell" :style="cssVars">
    <header class="app-header screen-only">
      <div>
        <h1>Generador de Tickets</h1>
        <p class="subtitle">Comprobantes internos no fiscales · Impresión en hojas A4</p>
      </div>
      <div class="toolbar" role="group" aria-label="Acciones principales">
        <button type="button" class="btn" @click="nuevoTicket">Nuevo ticket</button>
        <button type="button" class="btn btn-primary" @click="agregarTicketAlPdf">
          Agregar al PDF final
        </button>
        <button type="button" class="btn" @click="agregarCopia">Agregar copia</button>
        <button type="button" class="btn" :disabled="ticket.copias <= 1" @click="quitarCopia">
          Quitar copia
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!layout.fitsOnA4.value"
          @click="imprimir"
        >
          Imprimir / Guardar como PDF
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="!pdfTickets.length"
          @click="limpiarPdfFinal"
        >
          Vaciar PDF final
        </button>
      </div>
    </header>

    <div class="notices screen-only">
      <p v-if="pdfFeedback" :class="['notice', pdfNoticeClass]" role="status">{{ pdfFeedback }}</p>
      <p class="notice notice-warning" role="note">
        Las medidas, la tipografía y los márgenes pueden requerir calibración con una impresión de
        prueba.
      </p>
      <p class="notice notice-info" role="note">
        El correlativo es local al navegador y dispositivo. Sin backend no existe sincronización ni
        garantía de unicidad entre equipos. Para reducir duplicados, configure manualmente el
        próximo número antes de usar otro dispositivo o asigne rangos distintos por equipo.
      </p>
      <div v-if="!layout.fitsOnA4.value" class="notice notice-error" role="alert">
        <p><strong>El ticket no cabe en la hoja A4. La impresión está bloqueada:</strong></p>
        <ul>
          <li v-for="error in layout.fitErrors.value" :key="error">{{ error }}</li>
        </ul>
      </div>
      <p v-else-if="ticketOverflow" class="notice notice-error" role="alert">
        El contenido del ticket se desborda del área útil ({{ settings.ticketWidthMm }} ×
        {{ settings.ticketHeightMm }} mm menos paddings). No se ajustó nada automáticamente:
        reduzca texto, aumente las medidas o ajuste paddings y tipografía desde la configuración.
      </p>
      <p v-if="qrError" class="notice notice-error" role="alert">QR: {{ qrError }}</p>
    </div>

    <section class="info-card screen-only" aria-label="Información de impresión y correlativo">
      <dl>
        <dt>Medidas del ticket:</dt>
        <dd>{{ settings.ticketWidthMm }} × {{ settings.ticketHeightMm }} mm</dd>
      </dl>
      <dl>
        <dt>Columnas:</dt>
        <dd>{{ layout.columns.value }}</dd>
      </dl>
      <dl>
        <dt>Filas:</dt>
        <dd>{{ layout.rows.value }}</dd>
      </dl>
      <dl>
        <dt>Tickets por A4:</dt>
        <dd>{{ layout.ticketsPerPage.value }}</dd>
      </dl>
      <dl>
        <dt>Tickets registrados:</dt>
        <dd>{{ layout.ticketsRegistrados.value }}</dd>
      </dl>
      <dl>
        <dt>Tickets en PDF final:</dt>
        <dd>{{ layout.copias.value }}</dd>
      </dl>
      <dl>
        <dt>Hojas A4 requeridas:</dt>
        <dd>{{ layout.sheetsCount.value }}</dd>
      </dl>
      <dl>
        <dt>Número actual:</dt>
        <dd class="highlight">{{ ticket.numeroTicket }}</dd>
      </dl>
      <dl>
        <dt>Próximo correlativo:</dt>
        <dd class="highlight">{{ sequence.nextTicketNumber.value }}</dd>
      </dl>
    </section>

    <main class="layout">
      <div class="screen-only">
        <section class="panel" aria-label="Datos del ticket">
          <h2>Datos del ticket</h2>
          <TicketForm />
        </section>

        <section class="panel" aria-label="Configuración" style="margin-top: 16px">
          <button
            type="button"
            class="btn"
            :aria-expanded="configAbierta"
            @click="configAbierta = !configAbierta"
          >
            {{ configAbierta ? 'Ocultar configuración' : 'Mostrar configuración' }}
          </button>
          <SettingsPanel v-show="configAbierta" style="margin-top: 12px" />
        </section>
      </div>

      <section class="panel preview-panel screen-only" aria-label="Vista previa del ticket">
        <h2>Vista previa</h2>
        <div ref="scalerEl" class="preview-scaler">
          <div class="preview-box" :style="previewBoxStyle">
            <div class="preview-frame" :style="previewFrameStyle">
              <TicketPreview @overflow="onOverflow" />
            </div>
          </div>
        </div>
        <p class="preview-note">
          Previsualización escalada a {{ Math.round(previewScale * 100) }}% solo para pantalla. La
          impresión siempre usa el tamaño real configurado.
        </p>
        <p class="preview-note preview-qr-value">
          Valor exacto codificado en el QR: <strong>{{ settings.urlQr }}</strong>
        </p>
      </section>
    </main>

    <PrintSheet />
  </div>
</template>
