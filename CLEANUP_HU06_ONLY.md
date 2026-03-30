# Backend Cleanup: HU-06 Only Implementation

## Objetivo
Remover del backend todo el código específico de HU-02, HU-03, HU-04 y HU-05, dejando solo la funcionalidad necesaria para HU-06 (Registrar pago total de multa y rehabilitar lector).

## Cambios Realizados

### 1. **app.js**
**Muestra:** 
- ✅ Removed: `LoanRepository` instantiation
- ✅ Removed: `LoanService` instantiation  
- ✅ Removed: `makeLoanRouter` import y registration
- ✅ Removed: `/api/v1/loan` y `/api/v1/loans` route mounting

**Se mantiene:**
- ✅ DebtRepository instantiation
- ✅ DebtService instantiation
- ✅ debtRouter registration (`/api/v1/debt`, `/api/v1/debts`)
- ✅ readersRouter registration (`/api/v1/readers`)

---

### 2. **LoanRepository** (`src/repositories/loanRepository.js`)
**Status:** DEPRECATED - Archivo vaciado

**Eliminados todos los métodos:**
- `isBookAvailable()` - HU-01/02
- `insertLoan()` - HU-02
- `findByName()` - HU-01
- `getLoanById()` - HU-02
- `getActiveLoanByBook()` - HU-03/04
- `getLatestLoanByBook()` - HU-03/04
- `getActiveLoanByReader()` - HU-02, HU-03/04
- `getLatestLoanByReader()` - HU-03/04
- `getActiveLoanByBookAndReader()` - HU-03/04
- `getLatestLoanByBookAndReader()` - HU-03/04
- `getActiveLoanByTitleAndReader()` - HU-03/04
- `getActiveLoanByTitle()` - HU-03/04
- `updateReturn()` - HU-03/04

---

### 3. **LoanService** (`src/services/loanService.js`)
**Status:** DEPRECATED - Archivo vaciado

**Eliminados todos los métodos:**
- `searchAvailabilityByName()` - HU-01
- `createLoan()` - HU-02
- `getLoanById()` - HU-02
- `returnLoan()` - HU-03/04 (incluyendo lógica de Fibonacci)

---

### 4. **DebtRepository** (`src/repositories/debtRepository.js`)
**Status:** REFACTORED - Solo para HU-06

**Eliminados:**
- `getLatestPendingDebtByReader()` - Usada solo en HU-02 para validar deuda antes de crear préstamo
- `getAllPendingDebtsByReader()` - Usada en HU-05 para consultar deudas
- `createDebt()` - Usada en HU-04 para crear deudas al devolver tardío

**Se mantiene:**
- ✅ `getDebtById()` - Necesaria para HU-06 (payDebt)
- ✅ `markDebtAsPaid()` - Necesaria para HU-06 (payDebt)
- ✅ `getDebtByReaderWithFilters()` - Necesaria para HU-06 (GET /api/v1/readers/debt)

---

### 5. **DebtService** (`src/services/DebtService.js`)
**Status:** REFACTORED - Solo para HU-06

**Eliminados:**
- `getLatestPendingDebtByReader()` - HU-02
- `getAllPendingDebtsByReader()` - HU-05
- `createDebt()` - HU-04
- `calculateFibUnits()` - HU-04 (cálculo de deuda por retraso)
- `_generateFibonacciSequence()` - HU-04 (utilidad de Fibonacci)

**Se mantiene:**
- ✅ `getDebtById()` 
- ✅ `markDebtAsPaid()`
- ✅ `getDebtByReaderWithFilters()` 
- ✅ `payDebt()` 

---

### 6. **Loan Models** (`src/models/Loan.js`)
**Status:** DEPRECATED - Archivo vaciado

**Eliminados todos los esquemas Zod:**
- `createLoanSchema` - HU-02
- `returnLoanSchema` - HU-03/04
- `loanResponseSchema` - HU-02

---

### 7. **Loan Routes** (`src/routes/loanRoutes.js`)
**Status:** DEPRECATED - Todos los endpoints removidos

**Eliminados:**
- `GET /:name` - HU-01 (consultar disponibilidad de libro)
- `POST /` - HU-02 (crear préstamo)
- `PATCH /` - HU-03/04 (devolver libro)

---

## Endpoints Finales (Solo HU-06)

### GET /api/v1/readers/debt
- Busca deuda de un lector con filtros opcionales
- Query: `id` (requerido), `typeId` (opcional), `name` (opcional)
- Respuestas: 200, 400, 404

### PATCH /api/v1/debts/:id_debt
- Registra pago total de multa
- Body: `{ state_debt: "PAID" }`
- Respuestas: 200, 400, 404, 409

---

## Gestión de Dependencias

**LoanService** sigue siendo importado en app.js pero se mantiene solo como stub vacío para:
- Evitar quiebres en imports y configuración de DI
- Preservar la estructura para futuras extensiones si es necesario
- Claridad documentada de que fue removido intencionalmente

---

## Validación

✅ Sin errores de sintaxis  
✅ Sin errores de importación  
✅ Estructura de DI intacta  
✅ Solo código HU-06 funcional  
✅ Base de datos: TablesAux `loan_books` y `debt_reader` intactas (por compatibilidad futura)

---

## Notas Importantes

1. **Tablas de BD**: Se mantienen `loan_books` y `debt_reader` en schema.sql porque:
   - Permiten futura implementación de HU-02, HU-03, HU-04
   - Eliminadas: No hay integridad referencial que dependa de préstamos activos en HU-06
   - Los campos auxiliares de `debt_reader` se simplifican a lo mínimo

2. **Middleware y Configuración**: Se mantienen sin cambios:
   - `errorHandler.js` - Maneja errores generales, funciona con HU-06
   - `corsMiddleware.js`, `requestLogger.js` - Sin cambios
   - `db/initialize.js` - Sin cambios

3. **Arquivos Deprecated Files**: Mantienen estructura mínima por claridad:
   - Avisa explícitamente por qué fueron removidos
   - Permite búsqueda de referencias si es necesario
   - Facilita futuras auditorías o restauraciones

---

## Testing

Para validar que el backend solo implementa HU-06:

```bash
# Backend levanta sin errores
npm run dev

# Solo estos endpoints existen:
GET  /api/v1/readers/debt?id=123
PATCH /api/v1/debts/1

# Estos endpoints retornan 404 o no existen:
GET  /api/v1/loan/:name       # NO EXISTE
POST /api/v1/loans            # NO EXISTE  
PATCH /api/v1/loans           # NO EXISTE
GET  /api/v1/loan/outTime     # NO EXISTE
```

---

## Historial de Decisiones

| Decisión | Justificación |
|----------|--------------|
| Vaciado de archivos vs. eliminación | Mantención de estructura y claridad documental |
| Mantención de tablas loan_books | Compatibilidad con evolución futura del proyecto |
| Mantención de LoanRepository como stub | Evita quebres en DI si se refactoriza |
| Eliminación de `calculateFibUnits()` | No usada en HU-06, específica de HU-04 |
| Mantención de `debt_reader.loan_id` FK | Permite correlación histórica con préstamos |
