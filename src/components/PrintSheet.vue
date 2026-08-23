<script setup>
import { usePrintLayout } from '@/composables/usePrintLayout.js'
import TicketPreview from './TicketPreview.vue'

const { pages } = usePrintLayout()
</script>

<template>
  <!-- Área de impresión: oculta en pantalla, visible solo al imprimir. -->
  <div class="print-area print-only" aria-hidden="true">
    <section v-for="(page, pageIndex) in pages" :key="pageIndex" class="print-sheet">
      <TicketPreview
        v-for="ticketItem in page"
        :key="ticketItem.printId"
        :ticket-data="ticketItem"
        for-print
      />
    </section>
  </div>
</template>
