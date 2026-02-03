# SOP Técnico POS/Express (18 Pasos de Inicio a Fin)

Este documento contiene la copia de seguridad de los pasos técnicos definidos en el manual operativo para el proceso de venta POS y Express.

### A. Preparación y Selección
1.  **`addToCart(id)`**: Valida stock, agrega el producto al arreglo `app.state.cart` y aumenta cantidades.
2.  **`updateCartVisuals()`**: Recalcula subtotales, totales con envío y actualiza los badges de la UI.
3.  **`setDeliveryMethod(method)`**: Define si es "DOMICILIO" o "PICKUP", ajustando costos de envío y visibilidad de dirección.

### B. Configuración de Pago y Cliente
4.  **`openCheckout()`**: Abre el modal de compra y prepara el entorno del ticket express.
5.  **`handlePayMethodChange()`**: Gestiona la visibilidad de datos bancarios y captura de folio para transferencias.
6.  **`renderExpressTicket()`**: Genera el resumen visual de productos y costos para el cliente.

### C. Procesamiento Transaccional y OTP
7.  **`checkout(forcedStaff)`**: Valida datos, prepara el descuento de inventario y genera el código OTP de 4 dígitos.
8.  **`app.apiUrl / processFullOrder`**: Envío síncrono al backend para crear Lead, Pedido (con OTP), Pago y actualizar Stock.
9.  **`nextStep(3)`**: Muestra la confirmación de éxito con el Folio de Orden y el código OTP para el cliente.
10. **`sendWhatsApp()`**: Envía el resumen completo de la orden incluyendo el OTP al número del negocio.

### D. Ciclo de Seguimiento (Monitor POS)
11. **`renderPOS()`**: Pinta las tarjetas de pedidos en el monitor aplicando filtros por estatus.
12. **`filterPOS(status)`**: Clasifica los pedidos en el monitor según su etapa actual (Nuevos, Cocina, Listos, Camino, Entregados).
13. **`updateOrderStatus(id, 'EN-COCINA')`**: Cambia el pedido a preparación; el monitor actualiza la tarjeta visualmente.
14. **`updateOrderStatus(id, 'LISTO')`**: Marca el pedido como terminado en cocina y disponible para entrega o repartidor.
15. **`updateOrderStatus(id, 'EN-CAMINO')`**: Indica que el pedido ha salido de la sucursal (exclusivo para envíos a domicilio).

### E. Validación Final de Entrega
16. **`updateOrderStatus(id, 'ENTREGADO')`**: Dispara la lógica de verificación; si el pedido tiene OTP, detiene el flujo para validación.
17. **`showOtpEntry(id, status, correctOtp)`**: Abre el teclado numérico para que el repartidor ingrese el código que el cliente le entrega.
18. **`verifyOtp()`**: Compara el código; si es correcto, ejecuta el cambio de estatus final en el servidor y cierra la orden.
