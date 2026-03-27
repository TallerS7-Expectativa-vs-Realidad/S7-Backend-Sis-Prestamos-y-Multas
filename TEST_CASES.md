# TEST_CASES

## HU-01 - Consultar estado y disponibilidad de un libro

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-01-consultar-estado-disponibilidad-libro.spec.md`
- Historia base: `USER_STORIES.md`
- Contrato observable actual: `GET /api/v1/loans/{name}`

### Cobertura priorizada

- Smoke y crítico operacional: `TC-HU01-02`
- Happy path de disponibilidad con historial: `TC-HU01-01`
- Borde funcional por ausencia de historial: `TC-HU01-03`

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `BOOK-AVAILABLE-HISTORY-01` | `id_book=B-0901`, `title=Don Quijote`, último estado `RETURNED` | Libro disponible por historial cerrado |
| `BOOK-ON-LOAN-HISTORY-01` | `id_book=B-0902`, `title=La vorágine`, último estado `ON_LOAN` | Libro no disponible por préstamo activo |
| `BOOK-NO-HISTORY-QUERY-01` | `name=Manual de estanterías invisibles`, sin coincidencias en `loan_books` | Ausencia de historial operativo |

### Matriz HU-01

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-01 | `TC-HU01-01` | Dado que existe un libro cuyo último registro en historial está en `RETURNED`.<br>Cuando el bibliotecario consulta el libro por nombre.<br>Entonces el sistema informa la consulta correctamente y lo deja interpretable como disponible. | `BOOK-AVAILABLE-HISTORY-01` existe en `loan_books`.<br>Su último estado registrado es `RETURNED`. | `name=Don Quijote`. | 1. Enviar `GET /api/v1/loans/Don%20Quijote`.<br>2. Verificar la respuesta HTTP.<br>3. Validar la estructura funcional de la respuesta.<br>4. Confirmar que el resultado corresponde al último estado del historial. | `HTTP 200`.<br>`success=true`.<br>`message="Consulta realizada correctamente."`.<br>`data` contiene al menos un resultado con `id=B-0901`, `name=Don Quijote` y `status=RETURNED`.<br>Operativamente el libro queda interpretable como disponible para préstamo. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-01 | `TC-HU01-02` | Dado que existe un libro cuyo último registro en historial está en `ON_LOAN`.<br>Cuando el bibliotecario consulta el libro por nombre.<br>Entonces el sistema informa que el libro tiene un préstamo activo y no está disponible. | `BOOK-ON-LOAN-HISTORY-01` existe en `loan_books`.<br>Su último estado registrado es `ON_LOAN`. | `name=La vorágine`. | 1. Enviar `GET /api/v1/loans/La%20vor%C3%A1gine`.<br>2. Verificar la respuesta HTTP.<br>3. Validar la estructura funcional de la respuesta.<br>4. Confirmar que el historial más reciente conserva estado activo. | `HTTP 200`.<br>`success=true`.<br>`message="Consulta realizada correctamente."`.<br>`data` contiene al menos un resultado con `id=B-0902`, `name=La vorágine` y `status=ON_LOAN`.<br>Operativamente el libro queda interpretable como no disponible para préstamo. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-01 | `TC-HU01-03` | Dado que la búsqueda no encuentra historial previo en `loan_books` para el nombre consultado.<br>Cuando el bibliotecario realiza la consulta.<br>Entonces el sistema informa la ausencia de historial y considera el libro disponible sin hablar de inexistencia bibliográfica. | `BOOK-NO-HISTORY-QUERY-01` no tiene coincidencias previas en `loan_books`. | `name=Manual de estanterías invisibles`. | 1. Enviar `GET /api/v1/loans/Manual%20de%20estanter%C3%ADas%20invisibles`.<br>2. Verificar la respuesta HTTP.<br>3. Validar la estructura funcional de la respuesta.<br>4. Confirmar que el mensaje describe ausencia de historial y no inexistencia del libro. | `HTTP 200`.<br>`success=true`.<br>`data=[]`.<br>`message="El libro no registra historial de préstamo y se considera disponible para préstamo."`.<br>La respuesta no afirma que el libro no exista; solo informa ausencia de historial operativo. | `Sin ejecutar` | `Sin ejecutar` | Alto |

## HU-02 - Registrar préstamo de un libro a un lector habilitado

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-02-registrar-prestamo-libro.spec.md`
- Historia base: `USER_STORIES.md`

### Cobertura priorizada

- Smoke y crítico: `TC-HU02-01`
- Crítico de negocio: `TC-HU02-03`
- Altos de validación y bloqueo: `TC-HU02-02`, `TC-HU02-04`

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `BOOK-AVAILABLE-01` | `id_book=B-1001`, `title=Cien años de soledad` | Flujo exitoso |
| `BOOK-ON-LOAN-01` | `id_book=B-1002`, `title=1984`, último estado `ON_LOAN` | Libro no disponible |
| `BOOK-AVAILABLE-02` | `id_book=B-1003`, `title=El principito` | Rechazo por deuda |
| `BOOK-AVAILABLE-03` | `id_book=B-1004`, `title=Rayuela` | Rechazo por plazo inválido |
| `READER-ENABLED-01` | `type_id_reader=CI`, `id_reader=R-2001`, `name_reader=Ana Torres`, sin deuda `PENDING` | Flujo exitoso y plazo inválido |
| `READER-ENABLED-02` | `type_id_reader=DNI`, `id_reader=R-2002`, `name_reader=Carlos Rojas`, sin deuda `PENDING` | Libro ya prestado |
| `READER-BLOCKED-01` | `type_id_reader=CI`, `id_reader=R-2003`, `name_reader=Laura Díaz`, deuda más reciente `PENDING` | Lector bloqueado |

### Matriz HU-02

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-02 | `TC-HU02-01` | Dado que el libro está disponible y el lector no tiene deuda pendiente.<br>Cuando el bibliotecario registra el préstamo con `loan_days=7`.<br>Entonces el sistema crea el préstamo, calcula `date_limit` y deja el libro en `ON_LOAN`. | `BOOK-AVAILABLE-01` sin préstamo activo.<br>`READER-ENABLED-01` sin deuda pendiente. | `BOOK-AVAILABLE-01`.<br>`READER-ENABLED-01`.<br>`loan_days=7`. | 1. Enviar `POST /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Consultar `loan_books`.<br>4. Validar `state`, `date_return` y `date_limit`. | `HTTP 201`.<br>Se crea un nuevo registro en `loan_books`.<br>El préstamo queda con `state=ON_LOAN`, `date_return=null`, `loan_days=7`.<br>`date_limit` corresponde a fecha de registro + 7 días. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-02 | `TC-HU02-02` | Dado que el libro ya tiene un préstamo activo.<br>Cuando el bibliotecario intenta registrar un nuevo préstamo.<br>Entonces el sistema rechaza la operación y no crea un nuevo préstamo. | `BOOK-ON-LOAN-01` con último estado `ON_LOAN`.<br>`READER-ENABLED-02` sin deuda pendiente. | `BOOK-ON-LOAN-01`.<br>`READER-ENABLED-02`.<br>`loan_days=14`. | 1. Confirmar el estado activo del libro en historial.<br>2. Enviar `POST /api/v1/loans`.<br>3. Verificar código de respuesta.<br>4. Confirmar ausencia de inserción adicional en `loan_books`. | `HTTP 409`.<br>Código esperado `BOOK_NOT_AVAILABLE`.<br>No se crea nuevo registro en `loan_books`. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-02 | `TC-HU02-03` | Dado que el libro está disponible y el lector tiene una deuda pendiente.<br>Cuando el bibliotecario intenta registrar el préstamo.<br>Entonces el sistema rechaza la operación y no crea el préstamo. | `BOOK-AVAILABLE-02` disponible.<br>`READER-BLOCKED-01` con deuda más reciente `PENDING`. | `BOOK-AVAILABLE-02`.<br>`READER-BLOCKED-01`.<br>`loan_days=21`. | 1. Confirmar deuda pendiente del lector.<br>2. Enviar `POST /api/v1/loans`.<br>3. Verificar la respuesta HTTP.<br>4. Confirmar que no hubo inserción en `loan_books`. | `HTTP 409`.<br>Código esperado `READER_HAS_DEBT`.<br>No se crea nuevo registro en `loan_books`. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-02 | `TC-HU02-04` | Dado que el libro está disponible y el lector no tiene deuda pendiente.<br>Cuando el bibliotecario registra un préstamo con un plazo no permitido.<br>Entonces el sistema rechaza la operación y no crea el préstamo. | `BOOK-AVAILABLE-03` disponible.<br>`READER-ENABLED-01` sin deuda pendiente. | `BOOK-AVAILABLE-03`.<br>`READER-ENABLED-01`.<br>`loan_days=10`. | 1. Enviar `POST /api/v1/loans` con `loan_days=10`.<br>2. Verificar la respuesta HTTP.<br>3. Consultar `loan_books`.<br>4. Confirmar que no se creó un registro para `B-1004`. | `HTTP 400`.<br>Código esperado `INVALID_LOAN_DAYS`.<br>No se crea nuevo registro en `loan_books`. | `Sin ejecutar` | `Sin ejecutar` | Alto |

## HU-03 - Registrar devolución de un libro dentro del plazo

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-03-registrar-devolucion-en-plazo.spec.md`
- Historia base: `USER_STORIES.md`

### Cobertura priorizada

- Smoke y crítico de borde: `TC-HU03-02`
- Happy path principal: `TC-HU03-01`
- Altos de rechazo: `TC-HU03-03`, `TC-HU03-04`

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `LOAN-ACTIVE-EARLY-01` | `loan_id=L-3001`, `id_book=B-1101`, `id_reader=R-2101`, `type_id_reader=CI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Devolución antes del límite |
| `LOAN-ACTIVE-ON-LIMIT-01` | `loan_id=L-3002`, `id_book=B-1102`, `id_reader=R-2102`, `type_id_reader=DNI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Borde exacto de `date_limit` |
| `BOOK-WITHOUT-ACTIVE-LOAN-01` | `id_book=B-1103`, `id_reader=R-2103`, sin fila activa `ON_LOAN` | No existe préstamo activo |
| `LOAN-ALREADY-RETURNED-01` | `loan_id=L-3004`, `id_book=B-1104`, `id_reader=R-2104`, último estado `RETURNED`, `date_return` informado | Devolución duplicada |

### Matriz HU-03

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-03 | `TC-HU03-01` | Dado que existe un préstamo activo.<br>Cuando el bibliotecario registra la devolución antes de `date_limit`.<br>Entonces el sistema cierra el préstamo sin generar deuda. | `LOAN-ACTIVE-EARLY-01` con `state=ON_LOAN` y `date_limit=2026-04-10`. | `id_book=B-1101`.<br>`id_reader=R-2101`.<br>`type_id_reader=CI`.<br>`date_return=2026-04-08`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Consultar `loan_books`.<br>4. Confirmar ausencia de nueva deuda en `debt_reader`. | `HTTP 200`.<br>El mismo préstamo queda con `state=RETURNED`.<br>`date_return=2026-04-08`.<br>`days_late=0` o equivalente.<br>No se crea deuda nueva. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-03 | `TC-HU03-02` | Dado que existe un préstamo activo.<br>Cuando el bibliotecario registra la devolución el mismo día de `date_limit`.<br>Entonces el sistema cierra el préstamo, no genera deuda y el libro vuelve a quedar disponible. | `LOAN-ACTIVE-ON-LIMIT-01` con `state=ON_LOAN` y `date_limit=2026-04-10`. | `id_book=B-1102`.<br>`id_reader=R-2102`.<br>`type_id_reader=DNI`.<br>`date_return=2026-04-10`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar actualización del préstamo en `loan_books`.<br>4. Confirmar que no se creó deuda en `debt_reader`. | `HTTP 200`.<br>El préstamo queda en `RETURNED`.<br>`date_return=2026-04-10`.<br>No se crea deuda nueva.<br>El último estado del libro queda `RETURNED`, por lo tanto vuelve a estar disponible. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-03 | `TC-HU03-03` | Dado que no existe un préstamo activo para el libro o lector consultado.<br>Cuando el bibliotecario intenta registrar la devolución.<br>Entonces el sistema rechaza la operación y no altera historial ni deuda. | `BOOK-WITHOUT-ACTIVE-LOAN-01` sin fila activa `ON_LOAN`. | `id_book=B-1103`.<br>`id_reader=R-2103`.<br>`type_id_reader=CI`.<br>`date_return=2026-04-10`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar el código de respuesta.<br>3. Consultar `loan_books`.<br>4. Confirmar ausencia de nueva deuda en `debt_reader`. | `HTTP 404`.<br>Código esperado `LOAN_NOT_FOUND`.<br>Sin cambios en `loan_books`.<br>Sin deuda nueva. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-03 | `TC-HU03-04` | Dado que el préstamo ya fue devuelto.<br>Cuando el bibliotecario intenta registrar nuevamente la devolución.<br>Entonces el sistema rechaza la operación y no altera historial ni deuda. | `LOAN-ALREADY-RETURNED-01` con último estado `RETURNED` y `date_return` informado. | `id_book=B-1104`.<br>`id_reader=R-2104`.<br>`type_id_reader=CI`.<br>`date_return=2026-04-11`. | 1. Enviar `PATCH /api/v1/loans` con los mismos identificadores.<br>2. Verificar el código de respuesta.<br>3. Confirmar que no hubo una nueva actualización en `loan_books`.<br>4. Confirmar que no se creó deuda en `debt_reader`. | `HTTP 409`.<br>Código esperado `ALREADY_RETURNED`.<br>No se modifica `loan_books`.<br>No se crea deuda nueva. | `Sin ejecutar` | `Sin ejecutar` | Alto |

## HU-04 - Registrar devolución tardía y generar multa Fibonacci

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-04-registrar-devolucion-tardia-generar-multa.spec.md`
- Reglas base: `PRD.md`
- Casos obligatorios de mora: `1`, `7`, `8`, `15` y `22` días

### Cobertura priorizada

- Smoke y críticos del cálculo: `TC-HU04-01`, `TC-HU04-02`, `TC-HU04-03`
- Altos de cambio de tramo: `TC-HU04-04`, `TC-HU04-05`

### Matriz de referencia Fibonacci

| Días de mora | Semanas esperadas | Unidades Fibonacci esperadas | `amount_debt` esperado con `base_fib_amount=2.00` |
| --- | --- | --- | --- |
| `1` | `1` | `1` | `2.00` |
| `7` | `1` | `1` | `2.00` |
| `8` | `2` | `2` | `4.00` |
| `15` | `3` | `4` | `8.00` |
| `22` | `4` | `7` | `14.00` |

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `LOAN-LATE-01D-01` | `loan_id=L-4001`, `id_book=B-1201`, `id_reader=R-2201`, `type_id_reader=CI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Mora de 1 día |
| `LOAN-LATE-07D-01` | `loan_id=L-4002`, `id_book=B-1202`, `id_reader=R-2202`, `type_id_reader=DNI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Mora de 7 días |
| `LOAN-LATE-08D-01` | `loan_id=L-4003`, `id_book=B-1203`, `id_reader=R-2203`, `type_id_reader=CI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Mora de 8 días |
| `LOAN-LATE-15D-01` | `loan_id=L-4004`, `id_book=B-1204`, `id_reader=R-2204`, `type_id_reader=CC`, `state=ON_LOAN`, `date_limit=2026-04-10` | Mora de 15 días |
| `LOAN-LATE-22D-01` | `loan_id=L-4005`, `id_book=B-1205`, `id_reader=R-2205`, `type_id_reader=TI`, `state=ON_LOAN`, `date_limit=2026-04-10` | Mora de 22 días |

### Matriz HU-04

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-04 | `TC-HU04-01` | Dado que existe un préstamo activo vencido.<br>Cuando el bibliotecario registra la devolución con 1 día de mora.<br>Entonces el sistema cierra el préstamo y crea una deuda `PENDING` equivalente a 1 unidad Fibonacci. | `LOAN-LATE-01D-01` en `ON_LOAN`.<br>No existe deuda previa para ese `loan_id`. | `id_book=B-1201`.<br>`id_reader=R-2201`.<br>`type_id_reader=CI`.<br>`date_return=2026-04-11`.<br>`base_fib_amount=2.00`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar cierre del préstamo en `loan_books`.<br>4. Confirmar creación de deuda en `debt_reader`. | `HTTP 200`.<br>`state=RETURNED`.<br>`days_late=1`.<br>`units_fib=1`.<br>`amount_debt=2.00`.<br>La deuda queda en `PENDING` y trazable al `loan_id`. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-04 | `TC-HU04-02` | Dado que existe un préstamo activo vencido.<br>Cuando el bibliotecario registra la devolución con 7 días de mora.<br>Entonces el sistema mantiene el tramo de semana 1 y crea deuda acumulada de 1 unidad Fibonacci. | `LOAN-LATE-07D-01` en `ON_LOAN`.<br>No existe deuda previa para ese `loan_id`. | `id_book=B-1202`.<br>`id_reader=R-2202`.<br>`type_id_reader=DNI`.<br>`date_return=2026-04-17`.<br>`base_fib_amount=2.00`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar cierre del préstamo.<br>4. Confirmar deuda creada en `debt_reader`. | `HTTP 200`.<br>`days_late=7`.<br>`weeks=1`.<br>`units_fib=1`.<br>`amount_debt=2.00`.<br>No debe saltar a semana 2. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-04 | `TC-HU04-03` | Dado que existe un préstamo activo vencido.<br>Cuando el bibliotecario registra la devolución con 8 días de mora.<br>Entonces el sistema cambia al tramo de semana 2 y crea deuda acumulada de 2 unidades Fibonacci. | `LOAN-LATE-08D-01` en `ON_LOAN`.<br>No existe deuda previa para ese `loan_id`. | `id_book=B-1203`.<br>`id_reader=R-2203`.<br>`type_id_reader=CI`.<br>`date_return=2026-04-18`.<br>`base_fib_amount=2.00`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar cierre del préstamo.<br>4. Confirmar deuda creada en `debt_reader`. | `HTTP 200`.<br>`days_late=8`.<br>`weeks=2`.<br>`units_fib=2`.<br>`amount_debt=4.00`. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-04 | `TC-HU04-04` | Dado que existe un préstamo activo vencido.<br>Cuando el bibliotecario registra la devolución con 15 días de mora.<br>Entonces el sistema cambia al tramo de semana 3 y crea deuda acumulada de 4 unidades Fibonacci. | `LOAN-LATE-15D-01` en `ON_LOAN`.<br>No existe deuda previa para ese `loan_id`. | `id_book=B-1204`.<br>`id_reader=R-2204`.<br>`type_id_reader=CC`.<br>`date_return=2026-04-25`.<br>`base_fib_amount=2.00`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar cierre del préstamo.<br>4. Confirmar deuda creada en `debt_reader`. | `HTTP 200`.<br>`days_late=15`.<br>`weeks=3`.<br>`units_fib=4`.<br>`amount_debt=8.00`. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-04 | `TC-HU04-05` | Dado que existe un préstamo activo vencido.<br>Cuando el bibliotecario registra la devolución con 22 días de mora.<br>Entonces el sistema cambia al tramo de semana 4 y crea deuda acumulada de 7 unidades Fibonacci. | `LOAN-LATE-22D-01` en `ON_LOAN`.<br>No existe deuda previa para ese `loan_id`. | `id_book=B-1205`.<br>`id_reader=R-2205`.<br>`type_id_reader=TI`.<br>`date_return=2026-05-02`.<br>`base_fib_amount=2.00`. | 1. Enviar `PATCH /api/v1/loans`.<br>2. Verificar la respuesta HTTP.<br>3. Confirmar cierre del préstamo.<br>4. Confirmar deuda creada en `debt_reader`. | `HTTP 200`.<br>`days_late=22`.<br>`weeks=4`.<br>`units_fib=7`.<br>`amount_debt=14.00`. | `Sin ejecutar` | `Sin ejecutar` | Alto |

## HU-05 - Consultar préstamos vencidos y lector responsable

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-05-consultar-préstamos-vencidos-y-lector.spec.md`
- Historia base: `USER_STORIES.md`
- Contrato observable actual: `GET /api/v1/loans/outTime`

### Cobertura priorizada

- Smoke y crítico operacional: `TC-HU05-01`
- Alto de gestión sin atrasos: `TC-HU05-02`
- Alto de exclusión correcta de registros no vencidos: `TC-HU05-03`

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `OVERDUE-LOAN-01` | `loan_id=L-5001`, `id_book=B-1251`, `title=La Odisea`, `type_id_reader=CC`, `id_reader=R-2251`, `name_reader=Sara Mena`, `state=ON_LOAN`, `date_limit=2026-03-20`, `date_return=null` | Préstamo vencido visible en consulta |
| `OVERDUE-LOAN-02` | `loan_id=L-5002`, `id_book=B-1252`, `title=El Aleph`, `type_id_reader=TI`, `id_reader=R-2252`, `name_reader=Bruno Paz`, `state=ON_LOAN`, `date_limit=2026-03-24`, `date_return=null` | Segundo préstamo vencido para validar listado múltiple |
| `ACTIVE-NOT-DUE-01` | `loan_id=L-5003`, `id_book=B-1253`, `title=Ensayo sobre la ceguera`, `type_id_reader=CI`, `id_reader=R-2253`, `name_reader=Julia Lara`, `state=ON_LOAN`, `date_limit=2026-03-30`, `date_return=null` | Préstamo vigente que no debe aparecer |
| `RETURNED-PAST-LIMIT-01` | `loan_id=L-5004`, `id_book=B-1254`, `title=La tregua`, `type_id_reader=DNI`, `id_reader=R-2254`, `name_reader=Marco Gil`, `state=RETURNED`, `date_limit=2026-03-10`, `date_return=2026-03-18` | Préstamo cerrado que no debe mezclarse en la consulta |

### Matriz HU-05

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-05 | `TC-HU05-01` | Dado que existen préstamos fuera de plazo.<br>Cuando el bibliotecario consulta los préstamos vencidos.<br>Entonces el sistema lista solo los atrasados e identifica el lector responsable de cada uno. | Existen `OVERDUE-LOAN-01` y `OVERDUE-LOAN-02` en `loan_books`.<br>Ambos están en `state=ON_LOAN` con `date_limit` menor a la fecha actual.<br>No hay filtros adicionales aplicados en el request. | Sin body ni query params.<br>Endpoint `GET /api/v1/loans/outTime`. | 1. Enviar `GET /api/v1/loans/outTime`.<br>2. Verificar la respuesta HTTP.<br>3. Validar la estructura funcional de la respuesta.<br>4. Confirmar que cada fila listada incluye libro, lector responsable, estado y `date_limit`.<br>5. Verificar que `date_return` llegue en `null` para los préstamos activos vencidos. | `HTTP 200`.<br>`data` contiene al menos `L-5001` y `L-5002`.<br>`count=2` o equivalente al total de filas vencidas preparadas.<br>Cada elemento expone `loan_id`, `id_book`, `title`, `state=ON_LOAN`, `id_reader`, `name_reader`, `date_limit` y `date_return=null`.<br>La salida sirve para gestión operativa porque permite identificar qué libro está vencido y quién es el lector responsable. | `Sin ejecutar` | `Sin ejecutar` | Crítico |
| HU-05 | `TC-HU05-02` | Dado que no existen préstamos vencidos.<br>Cuando el bibliotecario consulta la bandeja de atrasos.<br>Entonces el sistema informa que no hay registros fuera de plazo sin mezclar préstamos vigentes o cerrados. | No existen filas en `loan_books` con `state=ON_LOAN` y `date_limit` menor a la fecha actual.<br>Si existen préstamos, todos están vigentes o cerrados. | Sin body ni query params.<br>Endpoint `GET /api/v1/loans/outTime`. | 1. Preparar un set sin préstamos vencidos.<br>2. Enviar `GET /api/v1/loans/outTime`.<br>3. Verificar la respuesta HTTP.<br>4. Confirmar que la consulta no devuelve filas operativas vencidas.<br>5. Si se valida la UI, comprobar el estado vacío mostrado al usuario. | `HTTP 200`.<br>`data=[]`.<br>`count=0`.<br>La consulta informa ausencia de atrasos mediante lista vacía.<br>Si se valida la vista, se muestra un estado vacío equivalente a "No hay préstamos vencidos en este momento". | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-05 | `TC-HU05-03` | Dado que existe una mezcla de préstamos vencidos, vigentes y ya cerrados.<br>Cuando el bibliotecario consulta los préstamos fuera de plazo.<br>Entonces el sistema excluye los registros vigentes o `RETURNED` y deja solo los realmente atrasados. | Existen `OVERDUE-LOAN-01`, `ACTIVE-NOT-DUE-01` y `RETURNED-PAST-LIMIT-01` en `loan_books`.<br>`OVERDUE-LOAN-01` cumple `state=ON_LOAN` y `date_limit` vencida.<br>`ACTIVE-NOT-DUE-01` sigue vigente.<br>`RETURNED-PAST-LIMIT-01` está cerrado con `state=RETURNED`. | Sin body ni query params.<br>Endpoint `GET /api/v1/loans/outTime`. | 1. Confirmar en base de datos la mezcla de estados y fechas límite.<br>2. Enviar `GET /api/v1/loans/outTime`.<br>3. Verificar la respuesta HTTP.<br>4. Confirmar que `L-5001` sí aparece en `data`.<br>5. Confirmar que `L-5003` y `L-5004` no aparecen en la respuesta.<br>6. Validar que todas las filas devueltas cumplan `state=ON_LOAN` y `date_limit` menor a hoy. | `HTTP 200`.<br>`data` contiene solo préstamos con `state=ON_LOAN` y `date_limit` vencida.<br>No aparecen préstamos vigentes ni registros con `state=RETURNED`.<br>La consulta no mezcla ruido operativo y conserva únicamente atrasos reales para seguimiento. | `Sin ejecutar` | `Sin ejecutar` | Alto |

## HU-06 - Registrar pago total de multa y rehabilitar lector

### Fuente de verdad

- Spec aprobada: `.github/specs/hu-06-registrar-pago-total-multa-rehabilitar-lector.spec.md`
- Historia base: `USER_STORIES.md`
- Contrato observable actual de pago: `PATCH /api/v1/debts/{id_debt}`
- Validación cruzada de rehabilitación: `POST /api/v1/loans`

### Cobertura priorizada

- Smoke y crítico de rehabilitación encadenada: `TC-HU06-04`
- Happy path principal de pago total: `TC-HU06-01`
- Alto de rechazo por deuda no pagable: `TC-HU06-02`
- Alto de habilitación operativa posterior al pago: `TC-HU06-03`

### Datos base sugeridos

| Alias | Datos | Uso |
| --- | --- | --- |
| `DEBT-PENDING-01` | `id_debt=D-6001`, `loan_id=L-6001`, `type_id_reader=CI`, `id_reader=R-2301`, `name_reader=María León`, `amount_debt=14.00`, `state_debt=PENDING` | Pago total exitoso y rehabilitación |
| `DEBT-PAID-01` | `id_debt=D-6002`, `loan_id=L-6002`, `type_id_reader=DNI`, `id_reader=R-2302`, `name_reader=Luis Pardo`, `amount_debt=8.00`, `state_debt=PAID` | Rechazo por deuda ya resuelta |
| `DEBT-NOT-FOUND-01` | `id_debt=999999`, sin coincidencias en `debt_reader` | Rechazo por deuda inexistente |
| `BOOK-AVAILABLE-04` | `id_book=B-1301`, `title=El otoño del patriarca`, sin préstamo activo | Nuevo préstamo tras rehabilitación |
| `BOOK-AVAILABLE-05` | `id_book=B-1302`, `title=La casa verde`, sin préstamo activo | Secuencia rechazo antes y aceptación después |
| `READER-REHAB-01` | `type_id_reader=CI`, `id_reader=R-2301`, `name_reader=María León`, con deuda más reciente `PENDING` y luego `PAID` | Flujo principal HU-06 |

### Matriz HU-06

| Historia de Usuario asociada | ID del Caso | Escenario Gherkin | Precondiciones | Datos de entrada | Pasos de ejecución | Resultado esperado | Resultado obtenido | Estado | Prioridad |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HU-06 | `TC-HU06-01` | Dado que el lector tiene una deuda pendiente.<br>Cuando el bibliotecario registra el pago total.<br>Entonces el sistema marca la deuda como `PAID` y el lector deja de figurar como bloqueado. | `DEBT-PENDING-01` existe en `debt_reader` con `state_debt=PENDING`.<br>No existe otro pago posterior para la misma deuda. | `id_debt=D-6001`.<br>Body: `state_debt=PAID`. | 1. Enviar `PATCH /api/v1/debts/D-6001`.<br>2. Verificar la respuesta HTTP.<br>3. Consultar `debt_reader` por `id_debt`.<br>4. Confirmar que el lector ya no aparece con esa deuda en estado `PENDING`. | `HTTP 200`.<br>`success=true`.<br>`data.id_debt=D-6001`.<br>`data.state_debt=PAID`.<br>`amount_debt` se conserva como valor histórico pagado y no queda saldo residual pendiente para esa deuda.<br>El lector deja de figurar bloqueado por `DEBT-PENDING-01`. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-06 | `TC-HU06-02` | Dado que el bibliotecario intenta pagar una deuda inexistente o ya resuelta.<br>Cuando registra el pago total.<br>Entonces el sistema rechaza la operación y no modifica deudas existentes. | Variante A: `DEBT-NOT-FOUND-01` no existe en `debt_reader`.<br>Variante B: `DEBT-PAID-01` existe con `state_debt=PAID`. | Variante A: `id_debt=999999`, body `state_debt=PAID`.<br>Variante B: `id_debt=D-6002`, body `state_debt=PAID`. | 1. Enviar `PATCH /api/v1/debts/999999`.<br>2. Verificar rechazo por deuda inexistente.<br>3. Enviar `PATCH /api/v1/debts/D-6002`.<br>4. Verificar rechazo por deuda ya pagada.<br>5. Confirmar que no hubo cambios en `debt_reader`. | Variante A: `HTTP 404` con código `DEBT_NOT_FOUND`.<br>Variante B: `HTTP 409` con código `DEBT_ALREADY_PAID`.<br>No se crea ni modifica ninguna deuda.<br>La operación no deja efectos laterales sobre otros lectores o préstamos. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-06 | `TC-HU06-03` | Dado que el lector tenía una deuda pendiente y ya registró el pago total.<br>Cuando el bibliotecario intenta un nuevo préstamo con un libro disponible.<br>Entonces el sistema permite la operación porque el lector quedó rehabilitado. | `READER-REHAB-01` tuvo una deuda previa y la más reciente ya quedó en `PAID`.<br>`BOOK-AVAILABLE-04` está disponible.<br>No existe otra deuda `PENDING` para `R-2301`. | `BOOK-AVAILABLE-04`.<br>`READER-REHAB-01`.<br>`loan_days=7`. | 1. Confirmar en `debt_reader` que la deuda más reciente del lector está en `PAID`.<br>2. Enviar `POST /api/v1/loans` con `B-1301` y `R-2301`.<br>3. Verificar la respuesta HTTP.<br>4. Confirmar creación del préstamo en `loan_books`. | `HTTP 201`.<br>Se crea un nuevo préstamo para `B-1301`.<br>El nuevo registro queda con `state=ON_LOAN` y `date_return=null`.<br>No se retorna `READER_HAS_DEBT`.<br>La rehabilitación se considera efectiva porque el lector vuelve a quedar habilitado para prestar. | `Sin ejecutar` | `Sin ejecutar` | Alto |
| HU-06 | `TC-HU06-04` | Dado que el lector tiene deuda pendiente y luego la paga totalmente.<br>Cuando el bibliotecario intenta prestar antes y después del pago.<br>Entonces el sistema rechaza el préstamo mientras la deuda está `PENDING` y lo acepta una vez queda en `PAID`. | `DEBT-PENDING-01` existe con `state_debt=PENDING` para `READER-REHAB-01`.<br>`BOOK-AVAILABLE-05` está disponible.<br>No existe préstamo activo previo sobre `B-1302`. | Antes del pago: `BOOK-AVAILABLE-05`, `READER-REHAB-01`, `loan_days=14`.<br>Pago: `id_debt=D-6001`, body `state_debt=PAID`.<br>Después del pago: mismos datos del préstamo. | 1. Enviar `POST /api/v1/loans` con `B-1302` y `R-2301` antes del pago.<br>2. Verificar rechazo y ausencia de inserción en `loan_books`.<br>3. Enviar `PATCH /api/v1/debts/D-6001` con `state_debt=PAID`.<br>4. Verificar actualización de la deuda.<br>5. Reenviar `POST /api/v1/loans` con los mismos datos.<br>6. Confirmar creación exitosa del préstamo. | Antes del pago: `HTTP 409` con código `READER_HAS_DEBT` y sin nuevo registro en `loan_books`.<br>Pago: `HTTP 200` con `state_debt=PAID`.<br>Después del pago: `HTTP 201` y nuevo préstamo creado con `state=ON_LOAN`.<br>Este caso valida de extremo a extremo que pago y rehabilitación son una misma cadena operativa. | `Sin ejecutar` | `Sin ejecutar` | Crítico |

## Lista rápida para sub-tareas en GitHub Projects

- HU-01: `TC-HU01-01`, `TC-HU01-02`, `TC-HU01-03`
- HU-02: `TC-HU02-01`, `TC-HU02-02`, `TC-HU02-03`, `TC-HU02-04`
- HU-03: `TC-HU03-01`, `TC-HU03-02`, `TC-HU03-03`, `TC-HU03-04`
- HU-04: `TC-HU04-01`, `TC-HU04-02`, `TC-HU04-03`, `TC-HU04-04`, `TC-HU04-05`
- HU-05: `TC-HU05-01`, `TC-HU05-02`, `TC-HU05-03`
- HU-06: `TC-HU06-01`, `TC-HU06-02`, `TC-HU06-03`, `TC-HU06-04`
