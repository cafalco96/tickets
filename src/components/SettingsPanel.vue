<script setup>
import { ref } from 'vue'
import { useSettings } from '@/composables/useSettings.js'
import { useTicketSequence } from '@/composables/useTicketSequence.js'

const { settings, resetSettings } = useSettings()
const sequence = useTicketSequence()

// Valor local del campo "Próximo número"; se aplica solo con el botón.
const proximoNumeroInput = ref(settings.nextTicketSequence)
const correlativoFeedback = ref('')
let feedbackTimer = null

function aplicarNuevoCorrelativo() {
  const value = Math.floor(Number(proximoNumeroInput.value))
  if (!Number.isFinite(value) || value < 0) {
    correlativoFeedback.value = 'Ingrese un número entero válido (0 o mayor).'
    return
  }
  const ok = window.confirm(
    `¿Aplicar el nuevo correlativo?\n\nEl próximo ticket usará la secuencia ${value}.`,
  )
  if (!ok) return
  if (sequence.setNextSequence(value)) {
    correlativoFeedback.value = `Aplicado. Próximo número: ${settings.ticketPrefix}${sequence.formatSequence(value)}`
  } else {
    correlativoFeedback.value = 'No se pudo aplicar el nuevo correlativo.'
  }
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    correlativoFeedback.value = ''
  }, 5000)
}

function restablecer() {
  const ok = window.confirm(
    '¿Restablecer toda la configuración a los valores por defecto?\n\nEsta acción no se puede deshacer.',
  )
  if (!ok) return
  resetSettings()
  proximoNumeroInput.value = settings.nextTicketSequence
}
</script>

<template>
  <section class="settings-panel" aria-label="Configuración">
    <details>
      <summary>Datos fijos del ticket</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-empresa1">Empresa línea 1</label>
          <input id="s-empresa1" v-model="settings.empresa1" type="text" />
        </div>
        <div class="field">
          <label for="s-empresa2">Empresa línea 2</label>
          <input id="s-empresa2" v-model="settings.empresa2" type="text" />
        </div>
        <div class="field">
          <label for="s-contribuyente">Contribuyente especial (resolución)</label>
          <input id="s-contribuyente" v-model="settings.contribuyenteEspecial" type="text" />
        </div>
        <div class="field">
          <label for="s-matriz1">Matriz línea 1</label>
          <input id="s-matriz1" v-model="settings.matriz1" type="text" />
        </div>
        <div class="field">
          <label for="s-matriz2">Matriz línea 2</label>
          <input id="s-matriz2" v-model="settings.matriz2" type="text" />
        </div>
        <div class="field">
          <label for="s-encabezado">Encabezado</label>
          <input id="s-encabezado" v-model="settings.encabezado" type="text" />
        </div>
        <div class="field">
          <label for="s-subtitulo">Subtítulo</label>
          <input id="s-subtitulo" v-model="settings.subtitulo" type="text" />
        </div>
        <div class="field">
          <label for="s-responsable">Responsable</label>
          <input id="s-responsable" v-model="settings.responsable" type="text" />
        </div>
        <div class="field">
          <label for="s-cargo">Cargo</label>
          <input id="s-cargo" v-model="settings.cargo" type="text" />
        </div>
      </div>
    </details>

    <details>
      <summary>Código QR</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-qr-size">Tamaño del QR (mm)</label>
          <input id="s-qr-size" v-model.number="settings.qrSizeMm" type="number" min="10" max="60" step="1" />
          <p class="field-hint">
            El QR apunta siempre a esta misma aplicación y reconstruye el ticket al escanearlo
            (formato <code>?ticket=…</code>). No requiere configuración de URL.
          </p>
        </div>
      </div>
    </details>

    <details>
      <summary>Marca de agua</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-watermark-url">Imagen de marca de agua (ruta en <code>public/</code> o URL externa)</label>
          <input
            id="s-watermark-url"
            v-model="settings.watermarkUrl"
            type="text"
            placeholder="/marca-de-agua.png o https://..."
          />
          <p class="field-hint">
            Vacío = sin marca de agua. Acepta una ruta relativa a <code>public/</code>
            (ej. <code>/marca-de-agua.png</code>) o una URL completa externa
            (ej. <code>https://ejemplo.com/marca.png</code>).
          </p>
        </div>
        <div class="field">
          <label for="s-watermark-opacity">Opacidad (0 a 1)</label>
          <input
            id="s-watermark-opacity"
            v-model.number="settings.watermarkOpacity"
            type="number"
            min="0"
            max="1"
            step="0.01"
          />
        </div>
      </div>
    </details>

    <details>
      <summary>Apariencia térmica y tipografía</summary>
      <div class="settings-grid">
        <div class="field field-checkbox">
          <input id="s-textura" v-model="settings.simularTexturaTermica" type="checkbox" />
          <label for="s-textura">Simular textura térmica</label>
        </div>
        <div class="field">
          <label for="s-intensidad-textura">Intensidad de textura (0 a 0.2)</label>
          <input
            id="s-intensidad-textura"
            v-model.number="settings.intensidadTexturaTermica"
            type="number"
            min="0"
            max="0.2"
            step="0.005"
          />
        </div>
        <div class="field">
          <label for="s-intensidad-tinta">Intensidad de tinta (0.5 a 1)</label>
          <input
            id="s-intensidad-tinta"
            v-model.number="settings.intensidadTinta"
            type="number"
            min="0.5"
            max="1"
            step="0.01"
          />
        </div>
        <div class="field">
          <label for="s-font-family">Fuente base</label>
          <select id="s-font-family" v-model="settings.baseFontFamily">
            <option value="Spleen Receipt 12x24">Spleen Receipt 12×24 (cero abierto)</option>
            <option value="Thermal Sans Mono">Thermal Sans Mono 12×24</option>
            <option value="Courier New">Courier New</option>
            <option value="Liberation Mono">Liberation Mono</option>
            <option value="ui-monospace">ui-monospace</option>
          </select>
        </div>
        <div class="field">
          <label for="s-font-size">Tamaño base (pt)</label>
          <input id="s-font-size" v-model.number="settings.baseFontSizePt" type="number" min="5" max="12" step="0.25" />
        </div>
        <div class="field">
          <label for="s-heading-size">Tamaño de encabezados (pt)</label>
          <input id="s-heading-size" v-model.number="settings.headingFontSizePt" type="number" min="5" max="14" step="0.25" />
        </div>
        <div class="field">
          <label for="s-line-height">Interlineado</label>
          <input id="s-line-height" v-model.number="settings.lineHeight" type="number" min="1" max="1.6" step="0.01" />
        </div>
        <div class="field">
          <label for="s-font-weight">Peso de fuente</label>
          <select id="s-font-weight" v-model="settings.fontWeight">
            <option value="400">400 (normal)</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700 (negrita)</option>
          </select>
        </div>
      </div>
    </details>

    <details>
      <summary>Medidas del ticket (mm)</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-ticket-width">Ancho del ticket</label>
          <input id="s-ticket-width" v-model.number="settings.ticketWidthMm" type="number" min="40" max="210" step="0.5" />
        </div>
        <div class="field">
          <label for="s-ticket-height">Alto del ticket</label>
          <input id="s-ticket-height" v-model.number="settings.ticketHeightMm" type="number" min="40" max="297" step="0.5" />
        </div>
        <div class="field">
          <label for="s-pad-top">Padding superior</label>
          <input id="s-pad-top" v-model.number="settings.paddingTopMm" type="number" min="0" max="80" step="0.5" />
        </div>
        <div class="field">
          <label for="s-pad-right">Padding derecho</label>
          <input id="s-pad-right" v-model.number="settings.paddingRightMm" type="number" min="0" max="60" step="0.5" />
        </div>
        <div class="field">
          <label for="s-pad-bottom">Padding inferior</label>
          <input id="s-pad-bottom" v-model.number="settings.paddingBottomMm" type="number" min="0" max="80" step="0.5" />
        </div>
        <div class="field">
          <label for="s-pad-left">Padding izquierdo</label>
          <input id="s-pad-left" v-model.number="settings.paddingLeftMm" type="number" min="0" max="60" step="0.5" />
        </div>
      </div>
    </details>

    <details>
      <summary>Impresión A4</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-print-margin">Margen de hoja (mm por lado)</label>
          <input id="s-print-margin" v-model.number="settings.printMarginMm" type="number" min="0" max="40" step="0.5" />
        </div>
        <div class="field">
          <label for="s-print-gap">Separación entre tickets (mm)</label>
          <input id="s-print-gap" v-model.number="settings.printGapMm" type="number" min="0" max="40" step="0.5" />
        </div>
      </div>
    </details>

    <details open>
      <summary>Correlativo local</summary>
      <div class="settings-grid">
        <div class="field">
          <label for="s-prefix">Prefijo del ticket</label>
          <input id="s-prefix" v-model="settings.ticketPrefix" type="text" />
        </div>
        <div class="field">
          <label for="s-seq-start">Número inicial</label>
          <input id="s-seq-start" v-model.number="settings.ticketSequenceStart" type="number" min="0" step="1" />
        </div>
        <div class="field">
          <label for="s-seq-digits">Cantidad de dígitos de la secuencia</label>
          <input id="s-seq-digits" v-model.number="settings.ticketSequenceDigits" type="number" min="1" max="12" step="1" />
        </div>
        <div class="field">
          <label for="s-incrementar">Política de incremento</label>
          <select id="s-incrementar" v-model="settings.incrementarAl">
            <option value="nuevo_ticket">Al crear un ticket nuevo</option>
            <option value="imprimir">Al pulsar imprimir</option>
          </select>
          <p v-if="settings.incrementarAl === 'imprimir'" class="field-hint">
            En el flujo por lote, el correlativo se conserva al agregar cada ticket al PDF final y
            la impresión solo abre el diálogo para guardar o imprimir el lote completo.
          </p>
        </div>
        <div class="field">
          <label for="s-next-seq">Próximo número</label>
          <div class="field-inline">
            <input id="s-next-seq" v-model.number="proximoNumeroInput" type="number" min="0" step="1" />
            <button type="button" class="btn btn-small" @click="aplicarNuevoCorrelativo">
              Aplicar nuevo correlativo
            </button>
          </div>
          <p class="field-hint">
            Próximo ticket: <strong>{{ sequence.nextTicketNumber.value }}</strong>
          </p>
          <p v-if="correlativoFeedback" class="field-feedback" role="status">{{ correlativoFeedback }}</p>
        </div>
      </div>
    </details>

    <div class="settings-actions">
      <button type="button" class="btn btn-danger" @click="restablecer">
        Restablecer configuración
      </button>
    </div>
  </section>
</template>
