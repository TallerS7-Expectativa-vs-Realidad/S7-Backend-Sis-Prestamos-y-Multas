# HU-06 - Gherkin QA

## Contexto

- Feature: `hu-06-registrar-pago-total-multa-rehabilitar-lector`
- Spec: `.github/specs/hu-06-registrar-pago-total-multa-rehabilitar-lector.spec.md`
- Regla central: pago total y rehabilitación forman una misma cadena operativa

## Escenarios Gherkin

```gherkin
#language: es
Característica: Pago total de multa y rehabilitación del lector

  @happy-path @alto
  Escenario: Registrar pago total de una deuda pendiente
    Dado que el lector tiene una deuda pendiente
    Cuando el bibliotecario registra el pago total
    Entonces el sistema marca la deuda como PAID
    Y el lector deja de figurar como bloqueado

  @error-path @alto
  Escenario: Intentar pagar una deuda inexistente o ya resuelta
    Dado que la deuda consultada no puede pagarse
    Cuando el bibliotecario intenta registrar el pago total
    Entonces el sistema rechaza la operación
    Y no modifica ninguna deuda existente

  @edge-case @alto
  Escenario: Rehabilitar al lector para un nuevo préstamo después del pago
    Dado que el lector tuvo una deuda pendiente y ya fue pagada totalmente
    Cuando el bibliotecario registra un nuevo préstamo con un libro disponible
    Entonces el sistema permite el préstamo
    Y no reporta bloqueo por deuda

  @smoke @critico
  Escenario: Rechazar antes del pago y aceptar después del pago total
    Dado que el lector tiene una deuda pendiente
    Cuando el bibliotecario intenta prestar un libro antes del pago
    Entonces el sistema rechaza el préstamo por deuda pendiente
    Cuando el bibliotecario registra el pago total de la deuda
    Y vuelve a intentar el préstamo con el mismo lector
    Entonces el sistema acepta la operación
    Y el lector queda rehabilitado operativamente
```

## Datos de prueba sugeridos

| Escenario | Campo | Válido | Inválido | Borde |
| --- | --- | --- | --- | --- |
| Pago total exitoso | `id_debt` | `D-6001` con `state_debt=PENDING` | `999999` sin registro | `D-6002` con `state_debt=PAID` |
| Pago total exitoso | `state_debt` | `PAID` | `PENDING`, vacío o ausente | `PAID` exacto en mayúsculas |
| Rehabilitación para nuevo préstamo | `id_reader` | `R-2301` sin deuda `PENDING` tras el pago | `R-2301` con deuda aún `PENDING` | mismo lector antes y después del pago |
| Rechazo antes y aceptación después | `id_book` | `B-1302` disponible | libro con préstamo activo | mismo libro libre en ambos intentos |

## Criterios de evidencia

- Captura del `PATCH /api/v1/debts/{id_debt}` con respuesta `200` y `state_debt=PAID`.
- Captura de validación en `debt_reader` antes y después del pago.
- Captura del `POST /api/v1/loans` rechazado antes del pago con `READER_HAS_DEBT`.
- Captura del `POST /api/v1/loans` aceptado después del pago con creación del préstamo.