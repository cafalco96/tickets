# Spleen Receipt 12×24

Archivos usados por el ticket:

- `SpleenReceipt-12x24.woff2` (formato principal para navegador)
- `SpleenReceipt-12x24.ttf` (respaldo TrueType)

Origen: <https://github.com/fcambus/spleen/releases/tag/2.2.0>

Paquete original: `spleen-2.2.0.tar.gz`

SHA-256 del paquete original:

```text
EC42925C6B56D2138C862B2F97147C872E472F674BF03423417D827A08D69A89
```

Los archivos web se generaron desde `spleen-12x24.bdf` de la publicación oficial 2.2.0. La única modificación de dibujo es el dígito `0`: reutiliza el bitmap ovalado y sin barra de la letra `O`, para aproximarse al ticket de referencia. La familia derivada se renombró `Spleen Receipt 12x24` para distinguirla de Spleen oficial.

Cada píxel activo del BDF se convirtió en un contorno rectangular TrueType sin alterar la cuadrícula 12×24. Debe utilizarse a su tamaño nativo de 24 píxeles cuando se quiera preservar estrictamente el bitmap; en el ticket se escala a las medidas físicas configuradas.

Copyright (c) 2018-2026 Frederic Cambus. Modificación local del cero para uso en tickets. Licencia BSD de 2 cláusulas. Consulte `LICENSE-Spleen.txt` para el texto completo.
