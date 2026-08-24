import { reactive, watch } from 'vue'
import { DEFAULT_SETTINGS, STORAGE_KEY } from '@/data/defaults.js'

// Estado único compartido (singleton a nivel de módulo).
const settings = reactive({ ...DEFAULT_SETTINGS })

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Carga la configuración desde localStorage con manejo seguro de datos corruptos.
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return
    const storedTypographyVersion = Number(parsed.typographyVersion || 1)
    const shouldMigrateLegacyFont =
      !('baseFontFamily' in parsed) ||
      parsed.baseFontFamily === 'Spleen 12x24' ||
      (storedTypographyVersion < 2 && parsed.baseFontFamily === 'Courier New')
    // Solo se aceptan claves conocidas para evitar inyectar basura en el estado.
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (key in parsed && typeof parsed[key] === typeof DEFAULT_SETTINGS[key]) {
        settings[key] = parsed[key]
      }
    }
    if (shouldMigrateLegacyFont) {
      settings.baseFontFamily = DEFAULT_SETTINGS.baseFontFamily
    }
    settings.typographyVersion = DEFAULT_SETTINGS.typographyVersion
    if ('matriz' in parsed && typeof parsed.matriz === 'string' && !('matriz1' in parsed)) {
      const [firstLine, ...rest] = parsed.matriz.split('\n')
      settings.matriz1 = firstLine || DEFAULT_SETTINGS.matriz1
      settings.matriz2 = rest.join('\n').trim() || DEFAULT_SETTINGS.matriz2
    }
    if ('empresa' in parsed && typeof parsed.empresa === 'string' && !('empresa1' in parsed)) {
      settings.empresa1 = parsed.empresa
      settings.empresa2 = DEFAULT_SETTINGS.empresa2
    }
  } catch (error) {
    console.warn('[ticket-generator] Configuración corrupta en localStorage, se usan los valores por defecto.', error)
  }
}

function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings }))
  } catch (error) {
    console.warn('[ticket-generator] No se pudo guardar la configuración en localStorage.', error)
  }
}

loadSettings()

// Persistencia automática ante cualquier cambio de la configuración.
watch(settings, persistSettings, { deep: true })

export function useSettings() {
  function resetSettings() {
    Object.assign(settings, structuredClone(DEFAULT_SETTINGS))
    persistSettings()
  }

  return {
    settings,
    resetSettings,
  }
}
