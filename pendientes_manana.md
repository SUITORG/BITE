# 📋 Pendientes para Mañana (2026-01-29)

Sesión finalizada el 2026-01-28 22:05. Se avanzó en la estabilidad del POS y visualización de logs, pero persisten fricciones operativas.

## 🔴 Bloqueadores Críticos (Prioridad 1)
1.  **Regresión de Estados (Firmeza de Tarjetas)**: 
    - Aunque se implementó el "Blindaje de Reconciliación (v4.6.4)", el usuario reporta que las tarjetas siguen regresando a "Nuevo" tras unos segundos.
    - **Tarea**: Investigar si el intervalo de refresco (`app.monitor.start`) está ignorando el cache local o si el servidor está sobreescribiendo con datos antiguos por un delay extremo en la propagación de Google Sheets.
2.  **Transición de Estados (Cocina -> Listo)**:
    - El usuario no logra que los pedidos pasen efectivamente a la pestaña de "Listos" de forma persistente.
3.  **Acceso y Permisos**:
    - Revisar problemas reportados de acceso/login que impiden la fluidez entre los 3 roles (Cliente, Cajero, Repartidor).

## 🛠️ Mejoras de Monitoreo (Prioridad 2)
1.  **Visibilidad de Logs**:
    - El usuario reporta que los logs en la barra de estado pasan muy rápido para leerse.
    - **Tarea**: Implementar un pequeño delay visual o una marquesina (marquee) para mensajes importantes en `BS-T`.
2.  **Estabilidad del Panel de Logs**:
    - Asegurar que el panel `[LOGS]` siempre capture el error exacto cuando una sincronización falla (Revisar bloque `catch` en `updateOrderStatus`).

## ✅ Avances de Hoy (Para Referencia)
- [x] **Orbit Hub Revamp**: Burbujas dinámicas y animadas para selección de negocios.
- [x] **Sistema de Logs v2**: Panel lateral expandido y sincronizado en tiempo real.
- [x] **Normalización de Contadores**: Unificación de lógica entre burbujas de filtro y tarjetas de pedidos.
- [x] **Respaldo Completado**: `SUIT_260128.zip` generado con éxito.

---
*Notas de Antigravity: Mañana empezaremos revisando directamente la lógica de `app.monitor` y el bridge de `loadData` para asegurar que el cache local sea mandatorio sobre el servidor durante la ventana de gracia.*
