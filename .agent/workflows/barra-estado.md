---
description: Estándar de implementación y mantenimiento de la Barra de Estado del Sistema.
---

Este workflow define los elementos obligatorios y el orden visual de la Barra de Estado (**Status Bar**) ubicada en la parte superior de la aplicación. Esta barra es la fuente de verdad del estado de la sesión, conexión y licenciamiento.

### Elementos Obligatorios (Orden de Izquierda a Derecha):

1.  **Indicador BS-T:** Identificador visual inamovible `BS-T`.
2.  **Usuario:** Nombre del usuario activo o "Visitante".
3.  **Nivel de Acceso:** Únicamente el número del nivel (ej: `5`, `10`). No debe incluir etiquetas como "Nivel:".
4.  **Rectángulo de Conexión:** Consola visual (`sb-console`) que indica el estado de sincronización con el Backend.
5.  **Versión:** Versión dinámica del backend (ej: `V: 3.2.1`).
6.  **Fecha:** Fecha actual del sistema.
7.  **Créditos / Fecha Límite:** 
    *   Si el consumo es por créditos: Símbolo de moneda + número de créditos (ej: `$ 45`).
    *   Si el consumo es por tiempo: Fecha límite de acceso (ej: `31/12/2026`).

### Reglas de Implementación (app.js):

*   **`app.ui.updateStatusBar()`**: Es la función central que debe actualizar todos estos campos.
*   **Contraste:** El texto debe ser legible sobre el fondo oscuro (`#1a202c`).
*   **Interactividad:** El rectángulo de conexión debe ser cliqueable para simular o ver logs de consola.

### Sincronización:
Cada vez que se actualice la versión del backend o el usuario realice una acción que consuma créditos, la barra de estado debe refrescarse automáticamente invocando `app.ui.updateStatusBar()`.

// turbo
### Verificación Visual:
1. Revisa que el ID `sb-level` contenga solo el número.
2. Revisa que el prefijo del indicador sea exactamente `BS-T`.
3. Valida que el modo de créditos (Global/Diario/Usuario) se refleje correctamente en el formato moneda o fecha.
