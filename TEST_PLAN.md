# TEST_PLAN.md

## 1. Identificación del plan

- Proyecto: Sistema de Préstamos y Multas
- Sistema bajo prueba: aplicación de gestión de préstamos, devoluciones y multas de biblioteca
- Versión del plan: 0.6
- Fecha: 2026-03-27

## 2. Contexto

El sistema permite registrar préstamos y devoluciones de libros, controlar la disponibilidad operativa desde el historial, generar multas por mora con lógica Fibonacci y rehabilitar al lector tras el pago total de su deuda. El problema de negocio que resuelve es evitar préstamos inválidos, cerrar devoluciones correctamente y mantener trazabilidad de deudas del lector hasta su pago.

## 3. Alcance de las pruebas

### Dentro del ciclo

- HU-01: consultar estado y disponibilidad de un libro
- HU-02: registrar préstamo de un libro disponible a un lector habilitado
- HU-03: registrar devolución de un libro dentro del plazo
- HU-04: registrar devolución tardía y generar multa Fibonacci
- HU-05: consultar préstamos vencidos y lector responsable
- HU-06: registrar pago total de multa y rehabilitar lector

### Fuera del ciclo

- Catálogo maestro de libros, prórrogas, reservas, notificaciones y reportería

## 4. Sistema bajo prueba

La aplicación bajo prueba es el sistema de préstamos y multas como producto funcional completo. Para este plan interesa validar el comportamiento de negocio observable del sistema, no describirlo por capas técnicas.

### Funcionalidades cubiertas

- Consulta mínima de disponibilidad por historial, incluyendo libro disponible, libro con préstamo activo y ausencia de historial
- Registro de préstamo válido y rechazos por indisponibilidad, deuda pendiente y plazo inválido
- Registro de devolución en fecha sin generación de multa
- Registro de devolución tardía con cálculo de mora y creación de deuda pendiente
- Consulta operativa de préstamos vencidos con lector responsable y exclusión de registros vigentes o cerrados
- Registro de pago total de deuda con cambio de estado a `PAID` y rehabilitación operativa del lector

## 5. Estrategia de pruebas

La estrategia será de riesgo, priorizando reglas críticas de negocio, validaciones funcionales y trazabilidad en persistencia. La matriz base de casos está documentada en `TEST_CASES.md`.

### Enfoque

- Pruebas funcionales sobre escenarios críticos y altos por historia de usuario
- Validación de respuestas funcionales del sistema
- Validación de disponibilidad operativa a partir del último estado en historial y de la ausencia de historial
- Verificación de persistencia en `loan_books` y `debt_reader`
- Validación de consulta operativa de atrasos, asegurando que solo se listan registros con `state=ON_LOAN` y `date_limit` vencida
- Revisión de regresión sobre validaciones, cortes Fibonacci y secuencia bloqueo por deuda → pago total → rehabilitación

### Sistema de triaje

- `Crítico`: rompe el flujo principal o incumple una regla obligatoria del negocio
- `Alto`: afecta validaciones clave, contratos o casos alternos relevantes
- `Medio`: afecta mensajes, compatibilidad secundaria o validaciones no bloqueantes
- `Bajo`: afecta detalles menores sin impacto funcional principal

## 6. Criterios de entrada y salida

### Criterios de entrada

- La historia tiene spec aprobada o definición funcional ya alineada con PRD
- El ambiente local está disponible con aplicación y base de datos operativas
- Existen datos base o pasos claros para prepararlos
- Los casos están definidos en `TEST_CASES.md`

### Criterios de salida

- Los casos críticos de la historia fueron planificados formalmente para esta entrega documental
- No quedan defectos críticos o altos sin registrar cuando la historia entre a ejecución QA
- Existe trazabilidad entre historia, caso, evidencia y resultado esperado
- En HU-01 se validan disponibilidad por `RETURNED`, indisponibilidad por `ON_LOAN` y ausencia de historial sin tratarla como inexistencia bibliográfica
- En HU-04 se validan los cortes obligatorios de `1`, `7`, `8`, `15` y `22` días
- En HU-05 se valida que la consulta liste solo préstamos vencidos, identifique el lector responsable y deje fuera préstamos vigentes o `RETURNED`
- En HU-06 se valida el rechazo por deuda pendiente, el pago total con `state_debt=PAID` y la rehabilitación efectiva para un nuevo préstamo

## 7. Entorno de pruebas

- Ambiente principal: entorno local del repositorio
- Backend: Node.js + Express
- Frontend: React + Vite
- Base de datos: PostgreSQL
- Configuración esperada: aplicación operativa y persistencia consultable para validación

## 8. Herramientas

- Postman: apoyo para exploración manual y revalidaciones rápidas
- pgAdmin o `psql`: verificación de trazabilidad en base de datos
- Herramienta de Recorte (Windows): Capturas de imagen o vídeo para una mejor documentación de los casos y su posterior evaluación.

## 9. Roles y responsabilidades

### Alexander Molina (QA)

- Diseñar y mantener `TEST_PLAN.md` y `TEST_CASES.md`
- Definir prioridades, datos de prueba y cobertura por historia
- Ejecutar o preparar la ejecución funcional según el ciclo
- Registrar evidencia, hallazgos y re-ejecuciones

### Gabriel Perero (DEV)

- Entregar funcionalidades ejecutables y corregibles localmente
- Aclarar comportamientos esperados y reglas funcionales
- Corregir defectos priorizados
- Apoyar con datos de prueba y trazabilidad técnica

## 10. Cronograma y estimación

La estimación de QA se plantea en Story Points y se distribuye en micro-sprints, no en horas. Esto sigue la recomendación del taller: evitar equivalencias rígidas entre esfuerzo DEV y QA y contemplar reutilización de repositorios o aceleración por automatización.

| Micro-sprint | Alcance QA | Estimación QA (SP) |
| --- | --- | --- |
| 1 | Ajuste del plan, definición de alcance y matriz inicial de casos | 3 |
| 2 | Preparación de datos, refinamiento de escenarios y trazabilidad | 3 |
| 3 | Ejecución funcional de HU-01, HU-02, HU-03, HU-04, HU-05 y HU-06 | 5 |
| 4 | Re-ejecución, consolidación de evidencia y cierre QA | 3 |

## 11. Entregables de prueba

- `TEST_PLAN.md`
- `TEST_CASES.md`
- Reportes de ejecución y evidencia QA
- Registro de defectos, re-ejecuciones y métricas básicas del ciclo

## 12. Riesgos y contingencias

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Inconsistencias entre documentación, spec e implementación | Alto | Tomar como referencia prioritaria PRD, specs aprobadas y comportamiento observable validado |
| Datos mal preparados o contaminados por historial previo | Alto | Definir datos base controlados y limpiar registros antes de cada ejecución crítica |
| Error en cortes de mora o acumulación Fibonacci | Alto | Validar explícitamente los casos de `1`, `7`, `8`, `15` y `22` días |
| Mezcla de préstamos vigentes o ya cerrados dentro de la consulta de atrasos | Alto | Preparar dataset mixto y verificar explícitamente que la salida solo incluya `state=ON_LOAN` con `date_limit` vencida |
| Rehabilitación incompleta del lector tras marcar la deuda como `PAID` | Alto | Validar de forma encadenada el rechazo previo por `READER_HAS_DEBT`, el pago exitoso y la aceptación de un nuevo préstamo |
| Retraso por curva de uso o preparación del entorno de prueba | Medio | Priorizar matriz, datos base y flujo crítico antes de ampliar cobertura |
| Diferencia entre esfuerzo QA esperado y esfuerzo real del ejercicio | Medio | Distribuir trabajo en micro-sprints y ajustar prioridad por riesgo |