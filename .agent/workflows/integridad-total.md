---
description: Garantiza la integridad técnica (versiones) y documental (manuales/roadmap) del sistema.
---
# Workflow: Integridad Total (Sincronización y Mantenimiento)

Este workflow unifica la sincronización técnica de versiones con la actualización de la documentación para asegurar que el sistema y su manual siempre coincidan.

### 1. Sincronización Técnica (Versiones)
Este paso es **obligatorio** tras cualquier cambio en `app.js` o `backend_schema.gs`.

1.  **Actualizar Backend**:
    - Incrementar la versión en el encabezado de `backend_schema.gs`.
    - Actualizar Fecha y Hora de modificación.
    - Asegurar que `CONFIG.VERSION` coincida.
2.  **Auditoría de Líneas**:
    - Contar líneas reales de `app.js`, `style.css`, `index.html` y `backend_schema.gs`.
    - Actualizar el bloque "AUDITORÍA DE LÍNEAS" en el backend.
3.  **Aviso de Apps Script**:
    - Informar EXPLÍCITAMENTE al usuario que debe copiar el código al editor de Google Apps Script.
4.  **Verificación de Semillas (Seeds)**:
    - Asegurar que registros maestros (Agentes IA, Roles Críticos, SEO base) existan en el backend mediante lógica de "Upsert".
    - **Requisito**: La verificación debe ser por ID único del registro, no solo por si la tabla esta vacía.

### 2. Actualización Documental
Asegura que el conocimiento del sistema no se pierda.

1.  **Manual Técnico (`tech_manual.md`)**:
    - Actualizar estadísticas de líneas en la sección 8.
    - Documentar nuevas reglas de negocio o tablas si aplica.
2.  **Hoja de Ruta (`roadmap.md`)**:
    - Marcar tareas completadas.
    - Actualizar la versión actual en la base del documento.

### 3. Registro de Soluciones
Si el cambio solucionó un error o implementó una lógica compleja:
- Invocar `/optimizacion-recursos` para registrar la "Huella Digital".

---
// turbo
### 4. Verificación de Cierre
- ¿La versión en `backend_schema.gs` coincide con la auditoría?
- ¿El conteo de líneas en `tech_manual.md` es exacto?
- ¿Se informó al usuario sobre la actualización manual del Script?
