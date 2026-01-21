---
description: Gestión y Modos de Consumo de Créditos (Sistema SaaS)
---

Este sistema utiliza un motor de créditos flexible para controlar el acceso a herramientas premium (IA, Cotizadores, etc.). Existen 3 modos configurables desde la pestaña `Config_Empresas` (columna `modo_creditos`).

### 1. Modo USUARIO (Créditos Personales)
Es el modo estándar y más restrictivo. Cada usuario tiene su propia "bolsa" de créditos.
- **Configuración:** `Config_Empresas[modo_creditos] = USUARIO`.
- **Comportamiento:** Cada vez que el usuario inicia sesión o realiza una acción premium, se descuenta 1 crédito de su saldo individual en la tabla `Usuarios`.
- **Uso ideal:** Empresas que quieren controlar el gasto exacto por empleado o vendedor.

### 2. Modo DIARIO (Suscripción por Día)
Funciona como un "pase diario". Permite uso ilimitado durante las 24 horas del día natural.
- **Configuración:** `Config_Companies[modo_creditos] = DIARIO`.
- **Comportamiento:** Al detectar el primer login del día, se descuenta **1 solo crédito** del saldo del usuario y se registra en la columna `ultimo_acceso`. Si el usuario entra 100 veces el mismo día, no se descuentan más créditos.
- **Uso ideal:** Equipos de alto volumen que necesitan usar las herramientas todo el día sin preocuparse por el conteo individual de acciones.

### 3. Modo GLOBAL (Pool de Empresa)
Utiliza un saldo compartido para toda la organización.
- **Configuración:** `Config_Companies[modo_creditos] = GLOBAL`.
- **Comportamiento:** El sistema ignora los créditos individuales de los usuarios. Cada vez que cualquier miembro de la empresa entra, se descuenta 1 crédito del saldo general de la empresa (columna `creditos_totales` en `Config_Empresas`).
- **Uso ideal:** Empresas pequeñas o familias de empresas (como EVASOL) que compran un paquete de créditos para todos sus departamentos.

---

### Reglas Transversales:
- **Fecha de Corte:** Sin importar el modo de créditos, si la `fecha_vencimiento` ha pasado, el acceso se bloquea totalmente.
- **Alertas de Saldo:** El sistema lanza una alerta visual cuando quedan **5 créditos o menos** disponibles para incentivar la recarga.
- **Persistencia:** Todos los descuentos se sincronizan en tiempo real con Google Sheets mediante la acción `updateUser` o `updateCompany`.

// turbo
### Verificación Técnica:
Revisa la lógica exacta en `app.js` -> `app.auth.login` (líneas 300-345) para confirmar el flujo de condiciones.
