---
description: Asegurar el funcionamiento del flujo de pedido (Comprar -> Datos -> WhatsApp)
---

Este workflow debe ejecutarse cada vez que se realicen cambios en `app.pos`, `style.css` (clases de carrito) o `backend_schema.gs`.

### 1. Validación de Visibilidad (UI)
- [ ] **Cápsula Flotante**: Verificar que `.cart-bar` aparezca al añadir el primer producto.
- [ ] **Contraste**: Asegurar que el borde (`--primary-color`) y la sombra sean visibles contra el fondo.
- [ ] **Responsive**: En móvil, verificar que no cubra elementos críticos y tenga el z-index correcto (1000+).

### 2. Validación de Cálculos (Lógica)
- [ ] **Subtotal**: Suma de `precio * cantidad`.
- [ ] **Envío**: Sumar `costo_envio` solo si el método es `DOMICILIO`.
- [ ] **Persistence**: Al recargar la página (con el sistema de caché local si existe), el total debe mantenerse.

### 3. Validación de Backend (GAS)
- [ ] **Registro de Proyecto**: Verificar que se cree una fila en la hoja `Proyectos` con estado `PEDIDO-RECIBIDO`.
- [ ] **Registro de Pago**: Verificar que se cree una fila en `Proyectos_Pagos` con referencia `CLIENTE-URL`.
- [ ] **Bitácora**: Confirmar la entrada automática del evento de creación.

### 4. Paso Final: WhatsApp
- [ ] **Check Handoff**: El botón "Confirmar Pedido" debe abrir una pestaña de WhatsApp.
- [ ] **Limpieza**: Tras abrir WhatsApp, el carrito debe quedar vacío automáticamente.
- [ ] **Navegación**: El sistema debe redirigir a `#home` o cerrar el modal.

// turbo
**Comando de verificación rápida (Simulación)**:
`node -e "console.log('Validando integridad de selectores CSS...');"`
