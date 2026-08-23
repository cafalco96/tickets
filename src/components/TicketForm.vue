<script setup>
import { ref, computed } from 'vue'
import { useTicket, validationErrorsForTicket } from '@/composables/useTicket.js'
import { useTicketSequence } from '@/composables/useTicketSequence.js'
import { useSettings } from '@/composables/useSettings.js'

const { ticket } = useTicket()
const { settings } = useSettings()
const sequence = useTicketSequence()

const feedback = ref('')
let feedbackTimer = null

function showFeedback(message) {
  feedback.value = message
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
  }, 5000)
}

// Acción explícita: toma la secuencia del número editado manualmente y la fija
// como base del próximo correlativo (la siguiente numeración parte de ahí).
function usarNumeroActualComoCorrelativo() {
  const seq = sequence.parseSequenceFromNumber(ticket.numeroTicket)
  if (seq === null) {
    showFeedback('No se pudo leer una secuencia numérica del número de ticket actual.')
    return
  }
  const next = seq + 1
  const ok = window.confirm(
    `¿Usar el número actual como base del correlativo?\n\n` +
      `El próximo ticket usará la secuencia ${next}.`,
  )
  if (!ok) return
  if (sequence.setNextSequence(next)) {
    showFeedback(`Correlativo actualizado. Próximo número: ${settings.ticketPrefix}${sequence.formatSequence(next)}`)
  } else {
    showFeedback('No se pudo aplicar el nuevo correlativo.')
  }
}

// Validaciones básicas del formulario.
const validationErrors = computed(() => {
  return validationErrorsForTicket(ticket)
})
</script>

<template>
  <form class="ticket-form" @submit.prevent>
    <fieldset>
      <legend>Identificación</legend>

      <div class="field">
        <label for="f-caseta">Caseta</label>
        <input id="f-caseta" v-model="ticket.caseta" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-ruc-emisor">RUC emisor</label>
        <input id="f-ruc-emisor" v-model="ticket.rucEmisor" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-numero-ticket">Número de ticket</label>
        <input id="f-numero-ticket" v-model="ticket.numeroTicket" type="text" autocomplete="off" />
        <button type="button" class="btn btn-small" @click="usarNumeroActualComoCorrelativo">
          Usar este número como próximo correlativo
        </button>
        <p v-if="feedback" class="field-feedback" role="status">{{ feedback }}</p>
      </div>

      <div class="field">
        <label for="f-fecha">Fecha de emisión</label>
        <input
          id="f-fecha"
          v-model="ticket.fechaEmision"
          type="text"
          placeholder="DD/MM/YYYY - HH:mm"
          autocomplete="off"
        />
      </div>

      <div class="field">
        <label for="f-recibo">Recibo caja No.</label>
        <input id="f-recibo" v-model="ticket.reciboCaja" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-codigo-barras">Código de barras</label>
        <input id="f-codigo-barras" v-model="ticket.codigoBarras" type="text" autocomplete="off" />
      </div>
    </fieldset>

    <fieldset>
      <legend>Contrato y proyecto</legend>

      <div class="field">
        <label for="f-contrato">Nro. de contrato</label>
        <input id="f-contrato" v-model="ticket.numeroContrato" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-proyecto-detalle">Proyecto</label>
        <input
          id="f-proyecto-detalle"
          v-model="ticket.proyectoDetalle"
          type="text"
          autocomplete="off"
        />
      </div>

      <div class="field">
        <label for="f-placa">Placa</label>
        <input id="f-placa" v-model="ticket.placa" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-numero">Número</label>
        <input id="f-numero" v-model="ticket.numero" type="text" autocomplete="off" />
      </div>
    </fieldset>

    <fieldset>
      <legend>Cliente</legend>

      <div class="field">
        <label for="f-cliente">Cliente</label>
        <input id="f-cliente" v-model="ticket.cliente" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-ruc-cliente">RUC/CI cliente</label>
        <input id="f-ruc-cliente" v-model="ticket.rucCiCliente" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-telefono">Teléfono</label>
        <input id="f-telefono" v-model="ticket.telefono" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-direccion">Dirección</label>
        <textarea id="f-direccion" v-model="ticket.direccion" rows="2"></textarea>
      </div>
    </fieldset>

    <fieldset>
      <legend>Detalle</legend>

      <div class="field">
        <label for="f-cantidad">Cantidad</label>
        <input
          id="f-cantidad"
          v-model.number="ticket.cantidad"
          type="number"
          min="0"
          step="0.01"
        />
      </div>

      <div class="field">
        <label for="f-descripcion">Descripción</label>
        <input id="f-descripcion" v-model="ticket.descripcion" type="text" autocomplete="off" />
      </div>

      <div class="field">
        <label for="f-precio">Precio unitario</label>
        <input
          id="f-precio"
          v-model.number="ticket.precioUnitario"
          type="number"
          min="0"
          step="0.01"
        />
      </div>

      <div class="field">
        <label for="f-costo">Costo</label>
        <input
          id="f-costo"
          v-model.number="ticket.costo"
          type="number"
          min="0"
          step="0.01"
          :disabled="!ticket.costoManual"
        />
      </div>

      <div class="field field-checkbox">
        <input id="f-costo-manual" v-model="ticket.costoManual" type="checkbox" />
        <label for="f-costo-manual">Editar costo manualmente (no recalcular)</label>
      </div>

      <div class="field">
        <label for="f-copias">Copias</label>
        <input id="f-copias" v-model.number="ticket.copias" type="number" min="1" max="99" step="1" />
      </div>
    </fieldset>

    <div v-if="validationErrors.length" class="form-errors" role="alert">
      <p><strong>Revise los datos del ticket:</strong></p>
      <ul>
        <li v-for="error in validationErrors" :key="error">{{ error }}</li>
      </ul>
    </div>
  </form>
</template>
