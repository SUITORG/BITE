---
description: Maestro de Procesos de Venta, Checkout y Notificaciones.
---

# 💸 MASTER WORKFLOW: Flujo de Ventas (Checkout & WhatsApp)

> **⚠️ REGLA DE ORO:** Siempre que se utilice este workflow, se debe reportar su ejecución a `/evaluador` para auditoría de cumplimiento.

Este documento consolida y regula todo el proceso transaccional del sistema, desde la selección de productos (UI) hasta la notificación final al negocio (WhatsApp), asegurando la integridad financiera y la experiencia del usuario.

---

## 🔖 ÍNDICE DE CONTENIDOS (Workflows Consolidados)
1.  **Proceso Checkout** (UI, Cálculos y Backend)
2.  **Orden Via WhatsApp** (Formato de Mensaje y Entrega)

---

## 1. 🛒 PROCESO DE CHECKOUT (`wproceso-checkout.md`)

Responsable de asegurar el funcionamiento técnico del flujo de pedido (Comprar -> Datos -> Transacción). Este bloque debe verificarse tras cambios en `app.pos`, estilos de carrito o esquema de base de datos.

### 1.1. Validación de Visibilidad (UI)
- [ ] **Cápsula Flotante**: Verificar que `.cart-bar` aparezca al añadir el primer producto.
- [ ] **Contraste**: Asegurar que el borde (`--primary-color`) y la sombra sean visibles contra el fondo.
- [ ] **Responsive**: En móvil, verificar que no cubra elementos críticos (como el footer o botones de navegación) y tenga el z-index correcto (1000+).

### 1.2. Validación de Cálculos (Lógica Financiera)
- [ ] **Subtotal**: Suma exacta de `precio * cantidad`.
- [ ] **Cargos de Envío**: Sumar `costo_envio` (definido en `Config_Empresas`) **solo** si el método seleccionado es `DOMICILIO`.
- [ ] **Persistencia**: Si el usuario recarga la página, el total y los items deben mantenerse (si existe caché).

### 1.3. Validación de Backend (Google Apps Script)
- [ ] **Registro de Proyecto**: Verificar que se cree una fila en la hoja `Proyectos` con estado inicial `PEDIDO-RECIBIDO`.
- [ ] **Registro de Pago**: Verificar que se cree una fila en `Proyectos_Pagos` vinculada al proyecto.
- [ ] **Bitácora**: Confirmar la entrada automática del evento de creación en la tabla de auditoría.

### 1.4. Paso Final: Handoff
- [ ] **Botón WhatsApp**: El botón "Confirmar Pedido" debe abrir una pestaña de WhatsApp con los datos serializados.
- [ ] **Limpieza Post-Venta**: Tras abrir WhatsApp, el carrito debe vaciarse (`app.pos.clearCart()`) automáticamente para evitar duplicidad.
- [ ] **Navegación**: El sistema debe redirigir a `#home` o mostrar un modal de agradecimiento.

---

## 2. 📱 NOTIFICACIÓN VIA WHATSAPP (`worden-whatsapp.md`)

Gestiona el formato y contenido del mensaje que recibe el negocio. Es el "Ticket Digital" oficial de la transacción.

### 2.1. Datos Obligatorios del Mensaje
Todo mensaje de orden debe incluir la siguiente estructura Markdown para legibilidad:
1.  **Cabecera**: Nombre del negocio y Folio de la Orden (ID de Proyecto).
2.  **Temporizador**: Fecha y hora exacta de la transacción.
3.  **Cliente**: Nombre y Teléfono de contacto.
4.  **Logística**: Método de entrega CLARO (Diferenciar entre "A DOMICILIO" y "RECOGER EN LOCAL").
5.  **Ubicación**: Dirección completa (Calle, Número, Colonia, Referencias) **solo** si es a domicilio.
6.  **Código de Entrega (OTP)**: Incluir el código de 4 dígitos generado para seguridad en la entrega.
7.  **Detalle**: Lista de productos con cantidad y subtotal individual (ej. `2x Hamburguesa Clasica ($150)`).
8.  **Finanzas**: Método de pago seleccionado y **TOTAL FINAL** (incluyendo cargos de envío).

### 2.2. Reglas de Implementación (Código)
- **Persistencia del Estado**: No se debe limpiar el carrito (`app.state.cart`) hasta que se haya disparado la acción de WhatsApp con éxito.
- **Folio Dinámico**: El ID retornado por el backend (`PROJ-123`) tras crear el proyecto debe ser capturado e inyectado en el mensaje.
- **Sanitización**: Asegurar que los caracteres especiales (`$`, `#`, `*`, `&`) se manejen correctamente (URL Encoding) para que el enlace de WhatsApp no se rompa.

### 2.3. Checklist de Verificación
Cada vez que se modifique el flujo de checkout, validar:
- [ ] ¿El total en WhatsApp coincide centavo por centavo con el total mostrado en el ticket de pantalla?
- [ ] ¿La dirección desaparece del mensaje si el método es "Recoger en Local"?
- [ ] ¿El botón de WhatsApp abre correctamente una nueva pestaña con el mensaje pre-cargado?

---

### 3. 🛠️ AUTOMATIZACIÓN Y VERIFICACIÓN TÉCNICA

// turbo
**Comando de verificación de integridad (Simulación)**:
`node -e "console.log('Validando selectores CSS del Checkout y Coherencia de Datos...');"`

> **Nota de Integridad (v4.6.9):** Toda transacción de venta ahora debe pasar por la acción de backend `processFullOrder` para garantizar la atomicidad de los datos.
