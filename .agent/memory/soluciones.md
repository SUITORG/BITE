# Memoria de Soluciones y Optimización

| Huella Digital | Tarea / Problema | Solución Aplicada | Estado | Ahorro Est. |
| :--- | :--- | :--- | :--- | :--- |
| `AI_GEMINI_V1_NOT_FOUND` | `models/gemini-1.5-flash` sigue sin encontrarse en algunas zonas/cuentas. | Implementar "AI Doctor" (`listAiModels`) para escanear y auto-seleccionar el modelo compatible. | ✅ Resuelto | 30 min |
| `AI_GEMINI_V1BETA_NOT_FOUND` | Error 404: `models/gemini-1.5-flash is not found for API version v1beta` | Cambiar el endpoint de `v1beta` a `v1` y usar `gemini-1.5-flash`. | ✅ Resuelto | 15 min |
| `AI_GEMINI_NO_CANDIDATES` | La IA responde con éxito 200 pero sin `candidates` (vacío). | Validar la estructura del JSON de respuesta y añadir manejo de errores detallado. | ✅ Resuelto | 10 min |
| `RBAC_STATUS_BAR_LEAK` | El nivel de acceso permanecía visible tras cerrar sesión. | Resetear `sb-level` a "0" e `indicator` a default en `setLoggedOutState`. | ✅ Resuelto | 5 min |
| `SEO_DYNAMIC_MATRIX` | Clústeres de SEO hardcodeados dificultaban mantenimiento. | Migración a tabla `Config_SEO`. Renderizado dinámico por JS. | ✅ Resuelto | 45 min |
| `FOOTER_SOCIAL_DYNAMIC` | Redes sociales estáticas o rotas si faltaba data. | Renderizado dinámico con manejo de "en construcción" (grayscale + grayscale alert). | ✅ Resuelto | 30 min |
| `UI_PILLARS_POLICIES_FOOTER` | Acceso difícil a Pilares y Políticas desde el landing. | Integración de enlaces dinámicos en el footer y refactor de `applyTheme` para actualizar todo el UI. | ✅ Resuelto | 20 min |
| `UI_CHAT_HTML_SPACES` | El chat mostraba etiquetas HTML literales ("códigos raros"). | Eliminar espacios accidentales tras `<` y antes de `>` en los template literals de `app.js`. | ✅ Resuelto | 10 min |
| `BACKEND_MISSING_SEEDS` | Nuevos agentes o roles no se creaban si la tabla ya existía pero estaba incompleta. | Implementar lógica de "Upsert" en la inicialización para verificar registros uno por uno en lugar de solo tablas vacías. | ✅ Resuelto | 20 min |
| `SEED_LOGIC_INDEX_FAIL` | La verificación de seeds fallaba por depender de índices fijos o nombres de tabla incorrectos. | Refactorizar a función `ensureSeed` que busca dinámicamente el encabezado 'id' para insertar con precisión. | ✅ Resuelto | 15 min |

