# 🧪 Workflow: test-utf8-integrity

Este workflow verifica que no existan caracteres corruptos (Mojibake) en las interfaces visibles para el usuario y personal operativo.

## 🤖 Nombre del Comando: `/test-utf8`

## 📋 Escenarios de Verificación

### 1. Interfaz Web (Cliente)
- **Acción**: Ir a `?co=PFM#home`.
- **Inspección**: Revisar el Hero Banner y la Matriz SEO.
- **Acción**: Abrir "Pedido Express" y agregar un producto.
- **Validación**: Verificar que el botón de "Pagar" y los textos del carrito no tengan símbolos como `Ã`, `ñƒ`, `Â`.

### 2. Mensajes de WhatsApp (Checkout)
- **Acción**: Completar un pedido de prueba y hacer clic en "Enviar WhatsApp".
- **Validación**: En la ventana/pestaña que se abre, verificar que los emojis y acentos sean legibles (ej: `Método` en lugar de `Mñƒ©todo`).

### 3. Panel de Operación (Staff)
- **Acción**: Login (`admin@evasol.mx`).
- **Navegación**: Ir a "Monitor".
- **Validación**: Revisar que los nombres de los clientes y estados (ej: `Recibido`) no tengan caracteres extraños.
- **Acción**: Cambiar un estado y verificar el mensaje de la Consola STBar.

### 4. Reportes y Exportación
- **Acción**: Ir a "Reportes" y generar un reporte diario.
- **Validación**: Verificar que los encabezados de las tablas y las monedas (`$`) se vean limpios.

## 🛠️ Regla de Oro (Mandataria)
Si se encuentra un solo carácter corrupto, el test se considera **FALLIDO** y se debe proceder a la limpieza masiva mediante el protocolo `/estandar-utf8`.
