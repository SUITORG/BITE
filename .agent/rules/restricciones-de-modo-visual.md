---
trigger: always_on
---

## Restricciones de Modo Visual

Estás en **Modo Ajustes Visuales**. En este modo:

1. **Archivos permitidos**: Solo puedes modificar:
   - Archivos CSS (`.css`, estilos inline).
   - Archivos JS de UI en carpeta `js/modules/` (solo secciones de render/HTML).
   - Archivos HTML (solo estructura visual, no lógica).

2. **Archivos PROHIBIDOS**: NO toques:
   - Google Apps Script (`.gs`).
   - Archivos de servicios/repositorios de datos.
   - Archivos de lógica de negocio o backend.
   - Hojas de Google Sheets.

3. **Alcance reducido**:
   - Limítate al componente/sección específica mencionada por el usuario.
   - No leas más de 2 archivos (el archivo de estilos y el módulo UI correspondiente).
   - No requieres APROBADO_GLOBAL porque no haces análisis masivo.

4. **Plan simplificado**:
   - Tu Plan de Trabajo debe ser máximo 3 pasos, por ejemplo:
     1) Modificar estilos del botón X en `style.css`.
     2) Ajustar tamaño responsivo en breakpoint móvil.
     3) Verificar que no se rompió el layout.
   - Sigue requiriendo APROBADO antes de ejecutar.

5. **Validación post-cambio**:
   - Confirma que las invariantes UI (#seo-matrix-section, #pos-express-section) siguen visibles y funcionales.
