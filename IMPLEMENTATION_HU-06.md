# Implementación Backend HU-06: Registrar Pago Total de Multa y Rehabilitar Lector

## Arquivos Modificados

### 1. `src/repositories/debtRepository.js`
**Método agregado:**
- `getDebtByReaderWithFilters(filters)` - Obtiene la deuda más reciente de un lector con filtros opcionales (id_reader requerido, typeId y name_reader opcionales)

### 2. `src/services/DebtService.js`
**Métodos agregados:**
- `getDebtByReaderWithFilters(filters)` - Valida que id_reader esté presente y obtiene la deuda. Lanza error 400 (INVALID_QUERY) si falta id_reader o 404 (DEBT_NOT_FOUND) si no existe deuda
- `payDebt(id_debt)` - Valida que la deuda existe, que está en estado PENDING. Lanza error 404 si no existe o 409 (DEBT_ALREADY_PAID) si ya fue pagada. Marca la deuda como PAID

### 3. `src/routes/debtRoutes.js`
**Cambios:**
- Mantiene endpoint existente: `GET /api/v1/debts/:id_reader`
- Agrega nuevo endpoint: `PATCH /api/v1/debts/:id_debt` - Registra pago total (solo acepta `state_debt: "PAID"`)

### 4. `src/routes/readersRoutes.js` (NUEVO)
**Nuevo archivo con router factory:**
- Endpoint: `GET /api/v1/readers/debt?id={id}&typeId={typeId}&name={name}`
  - Query params: `id` requerido, `typeId` y `name` opcionales
  - Respuesta 200: Deuda encontrada
  - Respuesta 400: Falta parámetro `id` (INVALID_QUERY)
  - Respuesta 404: No hay deuda para el lector (DEBT_NOT_FOUND)

### 5. `src/app.js`
**Cambios:**
- Importa nuevo `makeReadersRouter`
- Registra nuevo router en `/api/v1/readers`

## Endpoints Implementados

### 1. GET /api/v1/readers/debt
Obtiene la deuda pendiente de un lector con búsqueda por filtros

**Query Params:**
- `id` (requerido): ID del lector
- `typeId` (opcional): Tipo de ID del lector
- `name` (opcional): Nombre del lector

**Respuestas:**
```json
{
  "success": true,
  "data": {
    "id_debt": 1,
    "loan_id": 5,
    "type_id_reader": "CC",
    "id_reader": "12345",
    "name_reader": "Juan Pérez",
    "amount_debt": 14.00,
    "state_debt": "PENDING"
  },
  "message": "Debt retrieved successfully"
}
```

**Códigos de Error:**
- `400 INVALID_QUERY`: Falta el parámetro `id`
- `404 DEBT_NOT_FOUND`: No existe deuda para el lector

### 2. PATCH /api/v1/debts/{id_debt}
Registra el pago total de una deuda y rehabilita al lector

**Request Body:**
```json
{
  "state_debt": "PAID"
}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "data": {
    "id_debt": 1,
    "loan_id": 5,
    "type_id_reader": "CC",
    "id_reader": "12345",
    "name_reader": "Juan Pérez",
    "amount_debt": 14.00,
    "state_debt": "PAID"
  },
  "message": "Debt paid successfully"
}
```

**Códigos de Error:**
- `400 INVALID_PAYLOAD`: El body no contiene `state_debt: "PAID"` exactamente
- `404 DEBT_NOT_FOUND`: La deuda no existe
- `409 DEBT_ALREADY_PAID`: La deuda ya fue pagada

## Reglas de Negocio Implementadas

✅ Solo se permite pago total (validación en PATCH)  
✅ Al pagar se actualiza `state_debt = PAID`  
✅ Si no existe deuda pendiente, se responde con 404  
✅ No se permiten pagos duplicados (validación 409)  
✅ El lector queda habilitado una vez pagada la deuda

## Arquitectura Seguida

- **Orden de implementación:** models → repositories → services → controllers/routes
- **Inyección de dependencias:** Factories en routes que reciben servicios
- **Manejo de errores:** Errores con `statusCode` y `code` para middleware centralizado
- **Base de datos:** Queries parametrizadas usando `pg` para evitar SQL injection
- **Separación de capas:** Lógica de negocio en services, acceso a DB en repositories

## Validaciones Implementadas

1. Validación de query params (GET /api/v1/readers/debt)
   - Requiere `id` 
   - Maneja `typeId` y `name` opcionales

2. Validación de body (PATCH /api/v1/debts/{id_debt})
   - Requiere exactamente `state_debt: "PAID"`

3. Validaciones de negocio
   - Verifica que la deuda existe
   - Verifica que no está ya pagada
   - Verifica que está en estado PENDING
