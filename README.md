# Generador de Tickets

Aplicación web estática (SPA) para crear, agrupar e imprimir **comprobantes internos no fiscales** con apariencia de ticket térmico, distribuidos en hojas **A4** a tamaño físico real.

> No implementa facturación electrónica, SRI, login, usuarios, backend, API, base de datos remota, inventario, reportes, historial de tickets, exportador PDF propio ni autenticación.

## Stack

- Vue 3 (Composition API, `<script setup>`) + Vite, JavaScript.
- CSS estándar (sin Tailwind ni frameworks CSS).
- [`qrcode`](https://www.npmjs.com/package/qrcode) para el QR.
- Sin Vue Router, Pinia, Firebase, Supabase, backend ni API.
- Despliegue como sitio estático en Netlify.

## Instalación y uso

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción → dist/
npm run preview  # previsualizar el build
```

Requiere Node.js 20.19+ (recomendado 22.12+).

## Despliegue en Netlify

El repositorio incluye `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

1. Suba el proyecto a un repositorio Git.
2. En Netlify: **Add new site → Import an existing project** y seleccione el repositorio.
3. Netlify detecta la configuración automáticamente (`npm run build`, carpeta `dist`).
4. Deploy. No se requieren variables de entorno ni funciones serverless.

## Flujo de PDF final

La aplicación trabaja con un lote de tickets en memoria. Cada vez que pulse **Agregar al PDF final**:

1. El ticket actual se guarda como una instantánea inmutable dentro del lote.
2. La interfaz muestra un mensaje de éxito con el número agregado.
3. Se prepara automáticamente el siguiente ticket para que pueda seguir creando más.

Cuando termine, pulse **Imprimir / Guardar como PDF** y use el diálogo nativo del navegador para guardar el lote completo como PDF.

## Impresión en A4

Al pulsar **Imprimir / Guardar como PDF** se abre el diálogo nativo del navegador con el lote actual ya paginado. Para obtener medidas exactas:

1. Seleccione papel **A4**.
2. Elija escala **100%** o **Tamaño real**.
3. **Desactive** «Ajustar a página» / «Ajustar al área imprimible».
4. **Desactive** encabezados y pies de página del navegador.
5. **Active** «Gráficos de fondo» si desea imprimir la textura térmica o la marca de agua.
6. Haga una **impresión de prueba** y calibre si su impresora altera los márgenes.

Para generar un PDF, elija **Guardar como PDF** como destino en el mismo diálogo. La aplicación no incluye exportador PDF propio; usa el navegador para generar el PDF final a partir del lote creado.

### Distribución automática

Con la configuración inicial (ticket 79 × 183 mm, margen 8 mm, separación 4 mm) caben **2 columnas × 1 fila = 2 tickets por hoja A4**, alineados desde la esquina superior izquierda y sin escala. La interfaz muestra siempre columnas, filas, tickets por A4, tickets registrados y hojas requeridas. Si el ticket no cabe en el área útil, la impresión se bloquea y se indica qué dimensión, margen o padding corregir.

## Calibración

Todos los parámetros físicos son editables en **Configuración → Medidas del ticket / Impresión A4**:

- Ancho/alto del ticket y los cuatro paddings (iniciales: 79 × 183 mm; padding 30/12/21/6 mm).
- Margen de hoja y separación entre tickets.
- Tipografía: fuente, tamaños, interlineado, peso, intensidad de tinta y textura térmica.

Si el contenido se desborda del área útil, la aplicación muestra una advertencia y **no** reduce fuente, escala ni contenido automáticamente: ajuste la configuración manualmente.

## Correlativo local

- Formato: `{prefijo}{secuencia con ceros a la izquierda}` → `014-020-000027589`.
- Política inicial `nuevo_ticket`: el correlativo se consume al pulsar **Nuevo ticket**.
- Política opcional `imprimir`: el correlativo se conserva mientras arma el lote y se consolida al pasar al siguiente ticket o al imprimir un ticket suelto. El navegador no confirma de forma fiable que la impresión física terminó, por lo que **no es un registro de emisión**.
- El número del ticket actual puede editarse a mano; eso **no** altera el correlativo global. Para sincronizarlo use **«Usar este número como próximo correlativo»** (el próximo parte de la secuencia leída + 1) o **«Aplicar nuevo correlativo»** en Configuración.

> **Importante:** el correlativo es local al navegador y dispositivo. Sin backend no existe sincronización ni garantía de unicidad entre equipos. Para reducir duplicados, configure manualmente el próximo número antes de usar otro dispositivo o asigne rangos distintos por equipo. Este mecanismo no es un control legal, fiscal ni oficial.

## Persistencia

Solo se guarda en `localStorage` (clave `ticket-generator:settings:v1`) la **configuración** y el **estado del correlativo**. Los datos de los tickets emitidos o en edición **nunca se persisten**: al recargar, el formulario vuelve a los valores iniciales. El botón **Restablecer configuración** recupera todos los valores por defecto.

## Código QR

Todos los tickets codifican exactamente:

```text
https://ticketvalidador.emgirs.gob.ec/ticket/
```

Sin número de ticket, sin parámetros query, sin segmentos adicionales. La URL es editable en configuración, pero inicia con ese valor. El QR se imprime nítido: sin textura, sin opacidad y con zona silenciosa.

## Marca de agua (opcional)

La imagen final aún no está integrada. Mientras `watermarkUrl` esté vacío, la interfaz de edición muestra un placeholder discreto que **nunca se imprime**. Para activarla:

1. Copie la imagen a `public/` (por ejemplo `public/marca-agua.png`).
2. En **Configuración → Marca de agua** indique la URL (`/marca-agua.png`) y la opacidad (inicial 0.16).

La marca de agua se dibuja dentro del padding inferior de cada ticket, sin cubrir contenido ni QR.

## Fuente térmica 12×24

El ticket usa por defecto **Spleen Receipt 12×24**, una variante bitmap monoespaciada cuyas dimensiones corresponden a la cuadrícula habitual de ESC/POS Font A. El dígito `0` fue redibujado sin barra para aproximarse al original; el resto de los glifos conserva el diseño de Spleen. Los archivos web se sirven localmente desde `public/fonts/`; no dependen de una CDN.

La fuente base proviene de [`fcambus/spleen`](https://github.com/fcambus/spleen), versión 2.2.0, y se distribuye bajo licencia BSD de 2 cláusulas. La procedencia, modificación, hash del paquete original y licencia completa están documentados junto a los archivos de fuente.

Antes de imprimir, la aplicación espera la carga de la fuente seleccionada. Si la fuente térmica no está disponible, bloquea la impresión para evitar que el PDF se genere silenciosamente con `Courier New`.

## Estructura

```text
src/
  components/    TicketForm, TicketPreview, PrintSheet, SettingsPanel, QrCode
  composables/   useSettings, useTicket, useTicketSequence, usePrintLayout
  data/          defaults.js (valores por defecto)
  styles/        base.css, app.css, ticket.css, print.css
  App.vue
  main.js
public/
  fonts/                  Spleen Receipt 12×24, licencia y procedencia
  watermark-placeholder.svg
netlify.toml
```

## Límites conocidos

- El correlativo no se sincroniza entre dispositivos ni navegadores.
- La política `imprimir` no puede verificar que la impresión física terminó.
- Las medidas físicas dependen de la calibración de cada impresora: haga una impresión de prueba.
