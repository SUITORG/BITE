# 🧪 Workflow: test-hub-ui

Este workflow define cómo el agente debe validar la integridad del sistema (Login, Multi-inquilino y UI Base) utilizando el subagente de navegación.

## 1. Escenarios de Prueba (Mandatorios)

### A. Prueba de Acceso (Login)
1. **Acción**: Ir a `#home`, clic en "Acceso Staff".
2. **Datos**: Usar credenciales de `mock_data.json` (ej: admin@evasol.mx / admin).
3. **Validación**: Verificar que el hash cambie a `#dashboard` y que el nombre del usuario aparezca en la barra de estado.

### B. Prueba de Pedido Express (POS Cliente)
1. **Acción**: Ir a un inquilino (ej: `?co=PFM#home`), entrar a Menú.
2. **Acción**: Agregar 2 productos al carrito.
3. **Validación**: El contador del carrito flotante debe mostrar "2" y el subtotal debe ser mayor a 0.

### C. Prueba de Aislamiento Multi-Inquilino
1. **Acción**: Entrar a la empresa A.
2. **Acción**: Cambiar por URL a la empresa B.
3. **Validación**: El logo y el color del tema deben cambiar inmediatamente.

## 2. Instrucciones para el Agente
Cada vez que el usuario pida "Ejecutar pruebas locales", el agente debe:
1. Identificar la ruta absoluta del `index.html`.
2. Invocar `browser_subagent` con un plan paso a paso.
3. Reportar con capturas de pantalla o logs del navegador cualquier error detectado.

// turbo
## 3. Comandos de Verificación
1. `npx http-server ./` (Para levantar un servidor local rápido si `file://` da problemas de CORS).
