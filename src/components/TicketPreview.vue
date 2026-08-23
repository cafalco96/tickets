<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useSettings } from '@/composables/useSettings.js'
import { useTicket } from '@/composables/useTicket.js'
import QrCode from './QrCode.vue'

const props = defineProps({
  // true cuando se renderiza dentro de la hoja de impresión A4.
  forPrint: { type: Boolean, default: false },
  ticketData: { type: Object, default: null },
})

const emit = defineEmits(['overflow'])

const { settings } = useSettings()
const { ticket: liveTicket } = useTicket()
const ticket = computed(() => props.ticketData || liveTicket)

// Separador tipo impresora térmica. Se recorta con overflow:hidden según el ancho útil.
const SEPARATOR = '='.repeat(64)

const ticketEl = ref(null)

const money = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

// Posiciones verticales (mm desde el borde superior del ticket) de cada marca de agua.
const watermarkPositions = computed(() => {
  const repeat = Math.max(1, Math.floor(Number(settings.watermarkRepeat) || 1))
  const start = Number(settings.watermarkStartMm) || 0
  const step = Number(settings.watermarkStepMm) || 0
  const maxY = Number(settings.ticketHeightMm) || 183
  const positions = []
  for (let i = 0; i < repeat; i += 1) {
    const top = start + i * step
    if (top < maxY) positions.push(top)
  }
  return positions
})

const metaRows = computed(() => [
  { id: 'caseta', label: 'CASETA', value: ticket.value.caseta, group: 'group-1' },
  { id: 'rucEmisor', label: 'RUC', value: ticket.value.rucEmisor, group: 'group-1' },
  {
    id: 'numeroTicket',
    label: 'Ticket No.',
    value: ticket.value.numeroTicket,
    group: 'group-1',
  },
  {
    id: 'fechaEmision',
    label: 'Fecha Emisión',
    value: ticket.value.fechaEmision,
    group: 'group-1 group-1-end',
  },
  { id: 'reciboCaja', label: 'Recibo Caja No.', value: ticket.value.reciboCaja },
  { id: 'codigoBarras', label: 'Cód. Barras', value: ticket.value.codigoBarras },
  { id: 'numeroContrato', label: 'Nro. Contrato', value: ticket.value.numeroContrato },
  {
    id: 'proyectoDetalle',
    label: 'Proyecto',
    value: ticket.value.proyectoDetalle,
    group: 'group-2 meta-8',
  },
  { id: 'placa', label: 'Placa', value: ticket.value.placa, group: 'group-2' },
  { id: 'numero', label: 'Número', value: ticket.value.numero, group: 'group-2' },
  { id: 'cliente', label: 'Cliente', value: ticket.value.cliente, group: 'group-2' },
  { id: 'rucCiCliente', label: 'Ruc/CI', value: ticket.value.rucCiCliente, group: 'group-2' },
  {
    id: 'telefono',
    label: 'Teléfono',
    value: ticket.value.telefono,
    group: 'group-2 meta-penultimate',
  },
  { id: 'direccion', label: 'Dirección', value: ticket.value.direccion, group: 'group-2 meta-last' },
])

// Detección de desbordamiento: el contenido (.ticket-body) debe caber en el área
// útil del ticket (altura total menos paddings superior e inferior).
const bodyEl = ref(null)

async function checkOverflow() {
  if (props.forPrint) return
  await nextTick()
  const el = ticketEl.value
  const body = bodyEl.value
  if (!el || !body) return
  const cs = getComputedStyle(el)
  const usefulHeight = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  const usefulWidth = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
  const overflowing =
    body.scrollHeight > usefulHeight + 0.5 || body.scrollWidth > usefulWidth + 0.5
  emit('overflow', overflowing)
}

onMounted(() => {
  checkOverflow()
  window.addEventListener('resize', checkOverflow)
  document.fonts?.ready?.then(checkOverflow).catch(() => {})
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkOverflow)
})

watch([ticket, settings], checkOverflow, { deep: true })
</script>

<template>
  <article ref="ticketEl" class="ticket" aria-label="Ticket">
    <div ref="bodyEl" class="ticket-body">
      <header class="ticket-header">
        <p class="ticket-empresa">{{ settings.empresa1 }}</p>
        <p class="ticket-empresa ticket-empresa-line-2">{{ settings.empresa2 }}</p>
        <p class="ticket-header-line">
          Contribuyente Especial Resolución: {{ settings.contribuyenteEspecial }}
        </p>
        <p class="ticket-header-line">Matriz: {{ settings.matriz1 }}</p>
        <p class="ticket-header-line ticket-header-line-2">{{ settings.matriz2 }}</p>
        <h2 class="ticket-encabezado">{{ settings.encabezado }}</h2>
        <p class="ticket-subtitulo">{{ settings.subtitulo }}</p>
      </header>

      <dl class="ticket-meta">
        <div
          v-for="row in metaRows"
          :key="row.id"
          class="ticket-meta-row"
          :class="row.group"
        >
          <dt class="ticket-meta-label">{{ row.label }}</dt>
          <dd class="ticket-meta-value">:{{ row.value }}</dd>
        </div>
      </dl>

      <table class="ticket-detail">
        <colgroup>
          <col class="col-cant" />
          <col class="col-desc" />
          <col class="col-punit" />
          <col class="col-costo" />
        </colgroup>
        <thead>
          <tr class="ticket-detail-separator-row" aria-hidden="true">
            <th colspan="4"><div class="ticket-separator">{{ SEPARATOR }}</div></th>
          </tr>
          <tr>
            <th scope="col" class="col-cant">Cant</th>
            <th scope="col" class="col-desc">Descripción</th>
            <th scope="col" class="col-punit">P.Unit</th>
            <th scope="col" class="col-costo">Costo</th>
          </tr>
          <tr class="ticket-detail-separator-row" aria-hidden="true">
            <th colspan="4"><div class="ticket-separator">{{ SEPARATOR }}</div></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="col-cant">{{ money(ticket.cantidad) }}</td>
            <td class="col-desc">{{ ticket.descripcion }}</td>
            <td class="col-punit">{{ money(ticket.precioUnitario) }}</td>
            <td class="col-costo">{{ money(ticket.costo) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="ticket-separator" aria-hidden="true">{{ SEPARATOR }}</div>

      <p class="ticket-subtotal">
        <span>SUBTOTAL:</span>
        <span class="ticket-subtotal-value">{{ money(ticket.costo) }}</span>
      </p>
      <br>
      <div class="ticket-separator" aria-hidden="true">{{ SEPARATOR }}</div>

      <!-- Bloque inferior: texto a la izquierda, QR absoluto abajo a la derecha
           compartiendo la misma banda vertical, como en la referencia. -->
      <div class="ticket-bottom">
        <p class="ticket-responsable">
          <span class="ticket-meta-label">Responsable</span>
          <span class="ticket-meta-value">: {{ settings.responsable }}</span>
        </p>
        <p class="ticket-responsable">
          <span class="ticket-meta-label">Cargo</span>
          <span class="ticket-meta-value">: {{ settings.cargo }}</span>
        </p>
        <p class="ticket-original">- Original -</p>
        <div class="ticket-qr">
          <QrCode :value="settings.urlQr" :size-mm="Number(settings.qrSizeMm)" />
        </div>
      </div>
    </div>

    <!-- Marca de agua: repetida watermarkRepeat veces desde watermarkStartMm con
         separación watermarkStepMm. Debajo del texto y del QR. -->
    <div class="watermark-layer" aria-hidden="true">
      <template v-if="settings.watermarkUrl">
        <img
          v-for="(pos, index) in watermarkPositions"
          :key="index"
          class="watermark-img"
          :src="settings.watermarkUrl"
          alt=""
          :style="{ top: `${pos}mm`, opacity: settings.watermarkOpacity }"
          draggable="false"
        />
      </template>
      <template v-else-if="!forPrint">
        <img
          v-for="(pos, index) in watermarkPositions"
          :key="index"
          class="watermark-placeholder screen-only"
          src="/watermark-placeholder.svg"
          alt=""
          :style="{ top: `${pos}mm` }"
          draggable="false"
        />
      </template>
    </div>
  </article>
</template>
