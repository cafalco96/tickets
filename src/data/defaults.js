// Valores por defecto de la aplicación.
// Solo la configuración (DEFAULT_SETTINGS) se persiste en localStorage.
// Los datos del ticket (DEFAULT_TICKET_DATA) NUNCA se persisten.

export const STORAGE_KEY = 'ticket-generator:settings:v1'

export const DEFAULT_SETTINGS = {
  empresa1: 'Empresa Pública Metropolitana de Gestión',
  empresa2: 'Integral de Residuos Sólidos EMGIRS-EP',
  contribuyenteEspecial: '00162',
  matriz1: 'Telegráfica E7-58 y',
  matriz2: 'El Porvenir, Ed. PERSEUS, Quito',
  encabezado: 'TICKET PRE-PAGADO',
  subtitulo: 'Escombrera NEW OYACOTO',
  proyecto: 'Contrato de Prestación de Servicios',
  responsable: 'ESTEBAN TEJADA',
  cargo: 'Recaudador',

  qrSizeMm: 17,

  watermarkUrl: '',
  watermarkOpacity: 0.16,
  watermarkRepeat: 3,
  watermarkStartMm: 54,
  watermarkStepMm: 50,
  simularTexturaTermica: true,
  intensidadTexturaTermica: 0.035,
  intensidadTinta: 0.82,

  ticketWidthMm: 79,
  ticketHeightMm: 183,
  paddingTopMm: 30,
  paddingRightMm: 12,
  paddingBottomMm: 21,
  paddingLeftMm: 6,

  printMarginMm: 8,
  printGapMm: 4,

  typographyVersion: 4,
  baseFontFamily: 'Spleen Receipt 12x24',
  baseFontSizePt: 5.2,
  headingFontSizePt: 5.2,
  lineHeight: 1.14,
  fontWeight: '400',

  ticketPrefix: '014-020-',
  ticketSequenceStart: 27589,
  nextTicketSequence: 27589,
  ticketSequenceDigits: 9,
  incrementarAl: 'nuevo_ticket',
}

// Campos de configuración que deben viajar con cada ticket (codificados en el QR)
// para que, al escanearlo, se reconstruyan exactamente los datos fijos impresos.
export const TICKET_FIXED_FIELDS = [
  'empresa1',
  'empresa2',
  'contribuyenteEspecial',
  'matriz1',
  'matriz2',
  'encabezado',
  'subtitulo',
  'responsable',
  'cargo',
]

// Datos iniciales de un ticket nuevo. Solo viven en memoria.
export const DEFAULT_TICKET_DATA = {
  // Datos fijos del ticket (se copian de settings al crear un ticket y viajan en el QR)
  empresa1: DEFAULT_SETTINGS.empresa1,
  empresa2: DEFAULT_SETTINGS.empresa2,
  contribuyenteEspecial: DEFAULT_SETTINGS.contribuyenteEspecial,
  matriz1: DEFAULT_SETTINGS.matriz1,
  matriz2: DEFAULT_SETTINGS.matriz2,
  encabezado: DEFAULT_SETTINGS.encabezado,
  subtitulo: DEFAULT_SETTINGS.subtitulo,
  responsable: DEFAULT_SETTINGS.responsable,
  cargo: DEFAULT_SETTINGS.cargo,

  // Datos variables
  caseta: '20',
  rucEmisor: '1768158410001',
  numeroTicket: '',
  fechaEmision: '',
  reciboCaja: 'N/A',
  codigoBarras: '25539-8558-01-OK9ER1',
  numeroContrato: '25639',
  proyectoDetalle: 'Contrato de Prestación de Servicios 1793235020001',
  placa: 'PFV1363',
  numero: '0',
  cliente: 'CONSORCIO VIAL GFL',
  rucCiCliente: '1793235020001',
  telefono: '',
  direccion: 'PICHINCHA / QUITO / KENNEDY / EL MORLAN N48-24 Y MANUEL LIZARZABURU',
  cantidad: 12,
  descripcion: 'Escombros Diurno (M3)',
  precioUnitario: 0.7,
  costo: 8.4,
  costoManual: false,
  copias: 1,
}
