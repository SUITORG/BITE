# 🧪 Workflow: test-ots

Este protocolo permite al MCP validar la sincronización entre la vista del cliente y el monitor de producción en tiempo real.

## 🤖 Nombre del Comando: `/test-ots`

## 📋 Escenario de Prueba: "El Cliente Hambriento"

### Fase 1: Generación del Pedido (Vista Cliente)
1. **URL**: `http://localhost:8080/?co=PFM#home`
2. **Acción**: Clic en "Pedido Express".
3. **Acción**: Agregar al menos 2 ítems al carrito (clic en [+] o "Pedido Express").
4. **Acción**: Ir al Checkout:
   - Nombre: `Test MCP OTS`
   - Teléfono: `521999888777`
   - Entrega: `A Domicilio`
5. **Acción**: Clic en "Enviar Pedido por WhatsApp" (Simular clic para disparar backend).
6. **Validación**: Verificar que aparezca el modal de "Gracias" o que el carrito se limpie.

### Fase 2: Procesamiento en Monitor (Vista Staff)
1. **Ruta**: Ir a `#home`, clic en "Acceso Staff".
2. **Login**: `admin@evasol.mx` / `admin`.
3. **Navegación**: Ir al módulo "Monitor" en el menú superior.
4. **Acción (Cocina)**: Localizar pedido de `Test MCP OTS` y clic en **[🔥 COCINAR]**.
   - *Validación*: El pedido debe moverse a la columna "En Cocina".
5. **Acción (Listo)**: Clic en **[✅ LISTO]**.
   - *Validación*: El pedido debe moverse a la columna "Listos".

### Fase 3: Entrega Final (Blindaje)
1. **Acción**: Clic en **[🚚 ENTREGAR (OTS)]**.
2. **Validación Final**: El pedido debe desaparecer del monitor (estatus ENTREGADO) y la consola STBar debe mostrar `ORDER_UPDATED_OK`.

## 🛠️ Instrucciones para el Agente
1. Abrir dos pestañas o ventanas simultáneas si es posible.
2. Reportar el ID del pedido (`ORD-XXXX`) generado en la Fase 1.
3. Confirmar que el botón de "Entregar" sea visible para el Admin.

// turbo
## 4. Verificación de Entorno
1. Comprobar que `http-server` esté corriendo en el puerto 8080.
