---
description: Gestión de Notificaciones de Orden (WhatsApp)
---

# 📱 Flujo de Notificación WhatsApp ( SuitOrg )

Este workflow asegura que el mensaje enviado por WhatsApp contenga toda la información necesaria para que el negocio procese la orden sin dudas.

## 1. Datos Obligatorios del Mensaje
Todo mensaje de orden debe incluir:
1.  **Cabecera**: Nombre del negocio y Folio de la Orden (ID de Proyecto).
2.  **Temporizador**: Fecha y hora de la transacción.
3.  **Cliente**: Nombre y Teléfono.
4.  **Logística**: Método de entrega (Diferenciar entre "A DOMICILIO" y "RECOGER EN LOCAL").
5.  **Ubicación**: Dirección completa (solo si es a domicilio).
6.  **Detalle**: Lista de productos con cantidad y subtotal individual.
7.  **Finanzas**: Método de pago y **TOTAL FINAL** (incluyendo cargos de envío).

## 2. Reglas de Implementación (Código)
- **Persistencia del Estado**: No se debe limpiar el carrito (`app.state.cart`) hasta que se haya disparado la acción de WhatsApp o se haya cerrado el modal de éxito.
- **Folio Dinámico**: El ID retornado por el backend tras crear el proyecto debe ser capturado y mostrado en el mensaje.
- **Sanitización**: Asegurar que los caracteres especiales (`$`, `#`, `*`) se manejen correctamente para el formato de WhatsApp (Markdown).

## 3. Checklist de Verificación
Cada vez que se modifique el flujo de checkout, validar:
- [ ] El total en WhatsApp coincide con el total mostrado en el ticket.
- [ ] La dirección desaparece del mensaje si el método es "Recoger en Local".
- [ ] El botón de WhatsApp abre correctamente una nueva pestaña con el mensaje pre-cargado.
