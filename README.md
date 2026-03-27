# Biblioteca: Sistema de Prestamos y Multas

Repositorio de trabajo para el taller de la semana 7. El objetivo ya no es solo documentar el producto, sino usar esa base para construir un MVP funcional, integrado y trazable usando un flujo de trabajo compatible con ASDD.

## Equipo

- [Alexander Molina](https://github.com/AlexRieger47) - QA
- [Gabriel Perero](https://github.com/GabrielGNP) - DEV

## Qué problema resuelve

La biblioteca necesita una forma clara y consistente de:

- saber si un libro está disponible o prestado;
- registrar préstamos con fecha de devolución válida;
- detectar devoluciones tardías;
- calcular multas acumulativas por retraso;
- bloquear nuevos préstamos a lectores con deuda pendiente;
- rehabilitar al lector cuando paga la multa completa.

En esta etapa el equipo busca aterrizar esas reglas en una implementación mínima que permita demostrar el flujo principal del negocio y preparar la evidencia QA del sprint.

## Estado actual del proyecto

- Estado: en transición de MVP documental a MVP implementable.
- Estrategia de trabajo: micro-sprints con reparto QA y DEV.
- Framework de apoyo: ASDD como flujo de requerimiento -> spec -> implementación -> tests -> QA.

## Stack real del proyecto

- Backend: JavaScript
- Frontend: React
- Base de Datos: PostgreSQL

## Alcance técnico actual del MVP

La implementación actual se enfocará en el flujo principal del sistema:

- consulta mínima de disponibilidad de libro usando historial;
- registro de préstamo;
- devolución dentro del plazo;
- devolución tardía con multa acumulativa;
- bloqueo de préstamo a lector con deuda pendiente;
- preparación documental para pago de deuda y rehabilitación.

## Decisiones de modelado para este sprint

Para no abrir alcance innecesario en este sprint:

- no habrá catálogo formal de libros;
- no habrá recurso CRUD independiente de lectores;
- el historial de préstamos será la fuente de verdad operativa sobre disponibilidad;
- los datos del lector vivirán embebidos dentro del préstamo y la deuda;
- las entidades mínimas del MVP son `loan_books` y `debt_reader`.

Interpretación operativa acordada:

- si un libro no aparece en el historial, se asume que no tiene préstamos previos y está disponible para préstamo;
- esto no significa que exista un catálogo completo de biblioteca, solo que el MVP trabaja con historial como fuente operativa.

### Estados oficiales

**loan.state**
- `ON_LOAN`
- `RETURNED`

**debt.state_debt**
- `PENDING`
- `PAID`

## Entidades mínimas

### `loan_books`

- `loan_id`
- `id_book`
- `title`
- `state`
- `type_id_reader`
- `id_reader`
- `name_reader`
- `date_limit`
- `date_return`

### `debt_reader`

- `id_debt`
- `loan_id`
- `type_id_reader`
- `id_reader`
- `name_reader`
- `amount_debt`
- `state_debt`

## Convenciones de API recomendadas

- Actualmente el equipo identificó como base los recursos `loans` y `debts`.
- Usar versión en la ruta: `/api/v1/...`;

Base sugerida para este MVP:

- `GET /api/v1/loans/{name}`
- `POST /api/v1/loans`
- `PATCH /api/v1/loans`
- `GET /api/v1/debts/...` para fases posteriores
- `PATCH /api/v1/debts/{id}` para fases posteriores

## Contexto ASDD para este repositorio

Uso recomendado:

1. definir el requerimiento en `.github/requirements/`;
2. generar spec en `.github/specs/`;
3. revisar y aprobar la spec manualmente;
4. implementar con la spec como fuente de verdad;
5. derivar tests y artefactos QA desde la misma spec.

ASDD se usará como marco de trabajo y trazabilidad. No obliga a copiar literalmente el stack del template, porque el stack real del proyecto es JavaScript + React + PostgreSQL.

## Qué incluye este repositorio

- Un PRD con visión, reglas del negocio, alcance del MVP y riesgos.
- Historias de usuario con valor de negocio, criterios de aceptación, escenarios Gherkin y Story Points.
- Subtareas DEV y QA por cada historia.
- Trazabilidad documental del flujo principal del MVP.
- Referencia al tablero de GitHub Projects para el backlog del taller.

## Alcance del MVP

### Dentro del alcance

- Registrar el préstamo de un libro disponible.
- Permitir solo plazos de 7, 14 o 21 días.
- Calcular automáticamente la fecha de devolución.
- Registrar devoluciones dentro del plazo sin multa.
- Registrar devoluciones tardías con multa acumulativa.
- Aplicar lógica de multa Fibonacci por semanas de mora.
- Consultar préstamos vencidos y lector responsable.
- Registrar el pago total de una multa para rehabilitar al lector.
- Bloquear préstamos a lectores con deuda pendiente.

### Fuera del alcance

- Prórrogas de préstamo.
- Reservas.
- Administración completa del catálogo.
- Membresías o administración de usuarios.
- Notificaciones automáticas.
- Pagos parciales.
- Reportería avanzada.

## Historias del MVP

- HU-01: Consultar estado y disponibilidad de un libro.
- HU-02: Registrar libro disponible a un lector habilitado.
- HU-03: Registrar devolución de un libro dentro del plazo.
- HU-04: Registrar devolución tardía y generar multa Fibonacci.
- HU-05: Consultar libros fuera de plazo y lector responsable.
- HU-06: Registrar el pago total de una multa y rehabilitación del lector.

## Reparto de trabajo DEV y QA

### DEV

- Traducir cada historia a componentes técnicos concretos.
- Definir subtareas de UI, endpoints, persistencia, validaciones y lógica de dominio.
- Aterrizar el comportamiento esperado del sistema en trabajo implementable.

### QA

- Definir criterios de aceptación verificables.
- Redactar escenarios Gherkin centrados en comportamiento de negocio.
- Diseñar validaciones, alternos, bordes, datos de prueba y notas de calidad.

## Documentos principales

- [PRD.md](https://github.com/GabrielGNP/S6-Biblioteca-Sistema-de-Prestamos-y-Multas/blob/main/PRD.md)
- [USER_STORIES.md](https://github.com/GabrielGNP/S6-Biblioteca-Sistema-de-Prestamos-y-Multas/blob/main/USER_STORIES.md)
- [SUBTASKS.md](https://github.com/GabrielGNP/S6-Biblioteca-Sistema-de-Prestamos-y-Multas/blob/main/SUBTASKS.md)

## Tablero de trabajo

- [GitHub Projects del repositorio](https://github.com/users/GabrielGNP/projects/8/)



## Definition of Ready

Una historia se considera lista cuando:

- Tiene valor de negocio claro.
- Sus reglas relacionadas están identificadas.
- Sus criterios de aceptación son entendibles y verificables.
- Tiene subtareas DEV y QA coherentes.
- Tiene una estimación razonable en Story Points.

## Definition of Done

Para este momento del taller, una historia se considera terminada cuando:

- Tiene requerimiento y, cuando aplique, spec ASDD aprobada.
- Mantiene consistencia con el PRD, las subtareas y el sprint activo.
- Tiene comportamiento implementado o documentado según el alcance del sprint.
- Tiene criterios de aceptación verificables.
- Tiene evidencia QA o trazabilidad de validación.