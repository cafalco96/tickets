<script setup>
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  value: { type: String, required: true },
  sizeMm: { type: Number, default: 24 },
})

const emit = defineEmits(['error'])

const dataUrl = ref('')
const error = ref('')

async function generate() {
  try {
    error.value = ''
    emit('error', '')
    const text = String(props.value ?? '')
    if (!text.trim()) throw new Error('La URL del QR está vacía.')
    dataUrl.value = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 512,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch (e) {
    dataUrl.value = ''
    error.value = e?.message || 'No se pudo generar el código QR.'
    emit('error', error.value)
  }
}

onMounted(generate)
watch(() => props.value, generate)
</script>

<template>
  <div class="qr-code" :style="{ width: `${sizeMm}mm`, height: `${sizeMm}mm` }">
    <img
      v-if="dataUrl"
      class="qr-code-img"
      :src="dataUrl"
      :alt="`Código QR: ${value}`"
      width="512"
      height="512"
      draggable="false"
    />
    <div v-else class="qr-code-error" role="alert">
      <span>Error QR</span>
    </div>
  </div>
</template>
