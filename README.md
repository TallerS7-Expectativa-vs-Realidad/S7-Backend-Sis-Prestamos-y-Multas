# Backend API - Sistema de Préstamos y Multas

🏗️ **Este es un repositorio de servicios independientes dentro de la arquitectura modular del proyecto.**

Otros repositorios correlacionados:
- [**Frontend**](../S7-Frontend-Sis-Prestamos-y-Multas/) - React + Vite
- [**Arquitectura & Documentación**](../S7-Arquitectura/) - Specs, PRD, Test Plans

---

## 📋 Descripción

API REST para el sistema de gestión de préstamos de libros y cálculo de multas por devolución tardía. Construido con Node.js, Express y PostgreSQL.

**Objetivo del MVP:**
- Gestionar disponibilidad de libros mediante historial de préstamos
- Registrar préstamos con fecha de devolución válida
- Detectar devoluciones tardías y calcular multas con serie de Fibonacci
- Bloquear nuevos préstamos a lectores con deuda pendiente
- Rehabilitar lector al pagar la deuda completa

---

## 🏛️ Arquitectura

### Patrón en Capas

```
routes (HTTP) → services (lógica negocio) → repositories (DB) → PostgreSQL
```

### Estructura de Directorios

```
S7-Backend-Sis-Prestamos-y-Multas/
├── src/
│   ├── index.js                    # Entry point
│   ├── app.js                      # Express app setup
│   ├── db/
│   │   └── initialize.js           # Inicialización automática de BD
│   ├── middleware/
│   │   ├── errorHandler.js         # Manejo centralizado de errores
│   │   ├── corsMiddleware.js       # CORS config
│   │   └── requestLogger.js        # Logging de requests
│   ├── models/
│   │   ├── Loan.js                 # DTO Loan + validación (Zod)
│   │   └── debt.js                 # DTO Debt + validación (Zod)
│   ├── repositories/
│   │   ├── loanRepository.js       # Acceso a datos: préstamos
│   │   └── debtRepository.js       # Acceso a datos: deudas
│   ├── services/
│   │   ├── loanService.js          # Lógica: búsqueda y gestión de préstamos
│   │   └── DebtService.js          # Lógica: cálculo de deudas y pagos
│   └── routes/
│       ├── loanRoutes.js           # Endpoints: GET, POST, PATCH /loans
│       ├── debtRoutes.js           # Endpoints: POST /debt/pay
│       └── readersRoutes.js        # Endpoints: lectores (opcional)
├── db/
│   ├── schema.sql                  # Esquema de base de datos
│   ├── initialize.js               # Auto-inicialización al arrancar backend
│   └── migrate.js                  # Script local para migrations (dev)
├── tests/
│   ├── unit/
│   │   ├── repositories/           # Tests de acceso a datos
│   │   └── services/               # Tests de lógica de negocio
│   └── integration/
│       └── routes/                 # Tests de endpoints
├── Dockerfile                      # Imagen Docker del backend
├── docker-compose.yml              # (En S7-Arquitectura) Orquestación
├── package.json
├── .env.example                    # Template de variables de entorno
└── README.md
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** 18+ o **Docker**
- **PostgreSQL** 15+ (proporcionado vía Docker)
- **npm** o **yarn**

### Opción A: Con Docker (Recomendado)

Desde el directorio raíz (`S7-Arquitectura` o donde esté `docker-compose.yml`):

```bash
docker compose up --build
```

El backend:
1. Se construye desde `S7-Backend-Sis-Prestamos-y-Multas/Dockerfile`
2. Conecta a PostgreSQL automáticamente
3. Ejecuta `db/initialize.js` al iniciar → crea tablas si no existen
4. Expone la API en `http://localhost:3000`

### Opción B: Local (desarrollo)

#### 1. Instalar dependencias

```bash
cd S7-Backend-Sis-Prestamos-y-Multas
npm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` según tu entorno local (por defecto conecta a `localhost:5432`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
PORT=3000
NODE_ENV=development
```

#### 3. Inicializar base de datos

```bash
npm run migrate
```

O iniciar el backend (ejecuta auto-inicialización):

```bash
npm run dev
```

---

## 📡 Endpoints de API

### Loans (Préstamos)

| Método | Endpoint | Propósito | Estados |
|--------|----------|----------|---------|
| **GET** | `/api/v1/loans/{name}` | Buscar disponibilidad de libro | HU-01 ✅ |
| **POST** | `/api/v1/loans` | Registrar nuevo préstamo | HU-02 |
| **PATCH** | `/api/v1/loans` | Registrar devolución | HU-03, HU-04 |
| **GET** | `/api/v1/loans/overdue` | Listar préstamos vencidos | HU-05 |

#### GET `/api/v1/loans/{name}` - Buscar libro

```bash
curl http://localhost:3000/api/v1/loans/harry%20potter
```

**Response (200):**
```json
{
  "available": true,
  "book": {
    "id_book": "B001",
    "title": "Harry Potter",
    "lastState": "RETURNED"
  }
}
```

#### POST `/api/v1/loans` - Registrar préstamo

```bash
curl -X POST http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d '{
    "id_book": "B001",
    "title": "Harry Potter",
    "type_id_reader": "CC",
    "id_reader": "12345678",
    "name_reader": "Juan Pérez",
    "loan_days": 14
  }'
```

**Response (201):** Loan created
**Errores:**
- `400` - Datos inválidos
- `409` - Libro no disponible o lector con deuda pendiente

#### PATCH `/api/v1/loans` - Registrar devolución

```bash
curl -X PATCH http://localhost:3000/api/v1/loans \
  -H "Content-Type: application/json" \
  -d '{
    "date_return": "2026-04-01",
    "type_id_reader": "CC",
    "id_reader": "12345678"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Loan processed",
  "debt": null  // Si fue a tiempo; sino contiene deuda
}
```

**Errores:**
- `400` - Datos inválidos
- `404` - Préstamo no encontrado
- `409` - Préstamo ya devuelto

### Debts (Deudas)

| Método | Endpoint | Propósito | Estado |
|--------|----------|----------|--------|
| **GET** | `/api/v1/debt/{id_reader}` | Obtener deuda actual de lector | - |
| **POST** | `/api/v1/debt/pay` | Registrar pago de deuda | HU-06 |

#### POST `/api/v1/debt/pay` - Pagar deuda

```bash
curl -X POST http://localhost:3000/api/v1/debt/pay \
  -H "Content-Type: application/json" \
  -d '{
    "type_id_reader": "CC",
    "id_reader": "12345678"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "message": "Debt paid successfully",
  "reader": {
    "id_reader": "12345678",
    "name_reader": "Juan Pérez",
    "state_debt": "PAID"
  }
}
```

**Errores:**
- `400` - Lector sin deuda pendiente
- `404` - Lector no encontrado

---

## 💼 Reglas de Negocio (Critical)

### Disponibilidad de Libro

- ✅ Si el libro **NO tiene historial**, está disponible
- ✅ Si el último estado es **RETURNED**, está disponible
- ❌ Si el último estado es **ON_LOAN**, NO disponible

### Parámetros Válidos de Préstamo

- `loan_days` permitidos: **7, 14, 21** días únicamente
- `date_limit` se calcula: `loan_date + loan_days`

### Cálculo de Multa por Retraso

Usa serie de Fibonacci acumulativa:

```
dias_retraso = (date_return - date_limit) en días

semanas_completas = ((dias_retraso - 1) / 7) + 1
unidades_fibonacci = sum(fib[0..semanas - 1])
multa = unidades_fibonacci * BASE_FIB_AMOUNT
```

**Casos de referencia:**
- **1 día tarde** → 1 unidad → $1 (o x BASE_FIB_AMOUNT)
- **7 días tarde** → 1 (fib[0]) → $1
- **8 días tarde** → 2 (fib[0]+fib[1]) → $2
- **15 días tarde** → 4 (fib[0..3]) → $4
- **22 días tarde** → 7 (fib[0..4]) → $7

### Bloqueo de Nuevo Préstamo

❌ No se permite nuevo préstamo si:
- `debt.state_debt = PENDING`

✅ Se habilita nuevo préstamo después de:
- Pizar (`POST /api/v1/debt/pay`) → `state_debt = PAID`

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor con nodemon (auto-reload)

# Producción
npm start            # Inicia servidor en modo production

# Base de datos
npm run migrate      # Ejecuta schema.sql (solo local)

# Tests
npm test             # Ejecuta suite completa con Jest
npm run test:coverage # Genera reporte de cobertura

# Linting (opcional, no configurado aún)
npm run lint
```

---

## 🧪 Testing

### Archivos de Test

```
tests/
├── unit/
│   ├── repositories/loanRepository.test.js
│   ├── repositories/debtRepository.test.js
│   ├── services/loanService.test.js
│   └── services/DebtService.test.js
└── integration/
    └── routes/
        ├── loanRoutes.test.js
        └── debtRoutes.test.js
```

### Ejecutar Tests

```bash
# Tests unitarios + integración
npm test

# Con cobertura
npm run test:coverage

# Test específico
npm test -- loanService.test.js

# En modo watch
npm test -- --watch
```

### Stack de Testing

- **Framework**: Jest
- **HTTP**: Supertest (para integración)
- **Base de datos**: En-memory o fixtures (sin BD real)

---

## 📊 Modelos de Datos

### Entidad: `loan_books`

```sql
CREATE TABLE loan_books (
  loan_id SERIAL PRIMARY KEY,
  id_book VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  type_id_reader VARCHAR NOT NULL,
  id_reader VARCHAR NOT NULL,
  name_reader VARCHAR NOT NULL,
  state VARCHAR NOT NULL,           -- ON_LOAN | RETURNED
  date_limit DATE NOT NULL,
  date_return DATE,
  loan_days INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Entidad: `debt_reader`

```sql
CREATE TABLE debt_reader (
  id_debt SERIAL PRIMARY KEY,
  loan_id INT REFERENCES loan_books(loan_id),
  type_id_reader VARCHAR NOT NULL,
  id_reader VARCHAR NOT NULL,
  name_reader VARCHAR NOT NULL,
  amount_debt DECIMAL NOT NULL,
  state_debt VARCHAR NOT NULL,      -- PENDING | PAID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Configuración de Entorno

### Variables Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host:port/database

# Servidor
PORT=3000
NODE_ENV=development|production

# Opcional: Logging
LOG_LEVEL=debug|info|warn|error
```

### Archivo `.env.example`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
PORT=3000
NODE_ENV=development
```

---

## 🐳 Docker

### Build

```bash
docker build -t backend-s7 .
```

### Run (standalone)

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/postgres" \
  -e PORT=3000 \
  backend-s7
```

### Con docker-compose (recomendado)

Desde `S7-Arquitectura/`:

```bash
docker compose up --build backend
```

---

## 📚 Documentación Relacionada

- [**PRD**](../S7-Arquitectura/PRD.md) - Requisitos del producto
- [**Specs ASDD**](../S7-Arquitectura/.github/specs/) - Especificaciones técnicas detalladas
- [**Test Plan**](../S7-Arquitectura/TEST_PLAN.md) - Estrategia de testing
- [**Frontend README**](../S7-Frontend-Sis-Prestamos-y-Multas/README.md) - Documentación del cliente
- [**Arquitectura Global**](../S7-Arquitectura/CONTRIBUTING.md) - Guía de contribución

---

## 👥 Equipo y Contacto

Proyecto desarrollado para **Sofka**.

Equipo:
- **QA**: Alexander Molina
- **DEV**: Gabriel Perero

---

## 📄 Licencia

ISC

- `GET /api/v1/debts/:id_reader` - Get pending debts for a reader
  - Returns the pending debt records for the supplied reader id

- Compatibility alias currently exposed: `GET /api/v1/debt/:id_reader`

- `PATCH /api/v1/debts/{id_debt}` - Planned for HU-06 debt payment flow, not implemented yet

## Business Rules

**HU-02: Register Book Loan**

- `loan_days` must be 7, 14, or 21 days
- Book must be available (no active loans)
- Reader must have no pending debts
- Calculates `date_limit = today + loan_days`

### Response Codes

- `201` - Loan created successfully
- `400` - Invalid payload or invalid loan days (INVALID_PAYLOAD, INVALID_LOAN_DAYS)
- `409` - Conflict: book not available or reader has debt (BOOK_NOT_AVAILABLE, READER_HAS_DEBT)
- `500` - Internal server error

## Development Patterns

### Dependency Injection

Services are injected into route factories:

```javascript
const loanService = new LoanService(loanRepository, debtRepository);
const loanRouter = makeLoanRouter({ loanService });
app.use('/api/v1/loans', loanRouter);
```

### Error Handling

Errors are thrown with custom codes and status codes:

```javascript
const error = new Error('Book is not available');
error.code = 'BOOK_NOT_AVAILABLE';
error.statusCode = 409;
throw error;
```

### Database Operations

All DB operations are async and wrapped in repositories:

```javascript
async insertLoan(loanData) {
  const result = await this.pool.query(query, values);
  return result.rows[0];
}
```

## Testing

Tests are handled by a dedicated Test Engineer (see project specs).

## Database Schema

### loan_books Table

```sql
CREATE TABLE loan_books (
  loan_id SERIAL PRIMARY KEY,
  id_book VARCHAR(255),
  title VARCHAR(500),
  type_id_reader VARCHAR(50),
  id_reader VARCHAR(255),
  name_reader VARCHAR(255),
  loan_days INTEGER CHECK (loan_days IN (7, 14, 21)),
  state VARCHAR(50) CHECK (state IN ('ON_LOAN', 'RETURNED')),
  date_limit TIMESTAMP,
  date_return TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### debt_reader Table

```sql
CREATE TABLE debt_reader (
  id_debt SERIAL PRIMARY KEY,
  loan_id INTEGER REFERENCES loan_books(loan_id),
  type_id_reader VARCHAR(50),
  id_reader VARCHAR(255),
  name_reader VARCHAR(255),
  units_fib INTEGER,
  amount_debt NUMERIC(10, 2),
  state_debt VARCHAR(50) CHECK (state_debt IN ('PENDING', 'PAID')),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Docker Deployment

Build the backend image:

```bash
docker build -t backend-s7 .
```

Run with docker image :

```bash
docker run -it --name backend-s7 -e DATABASE_URL="postgresql://postgres:postgres@172.17.0.1:5432/postgres" -e PORT=3000 -e NODE_ENV=development -p 3000:3000 backend-s7
```

The API will be available at `http://localhost:3000`

## Related Specifications

- [HU-01: Query Book Availability](../.github/specs/hu-01-consultar-estado-disponibilidad-libro.spec.md)
- [HU-02: Register Loan (this feature)](../.github/specs/hu-02-registrar-prestamo-libro.spec.md)
- [HU-03: Register On-time Return](../.github/specs/hu-03-registrar-devolucion-en-plazo.spec.md)
- [HU-04: Register Late Return](../.github/specs/hu-04-registrar-devolucion-tardia-generar-multa.spec.md)
- [HU-05: Query Overdue Loans](../.github/specs/hu-05-consultar-préstamos-vencidos-y-lector.spec.md)
- [HU-06: Register Debt Payment](../.github/specs/hu-06-registrar-pago-total-multa-rehabilitar-lector.spec.md)
