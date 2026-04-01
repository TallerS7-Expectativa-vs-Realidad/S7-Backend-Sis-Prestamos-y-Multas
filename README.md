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

## 💼 Reglas de Negocio Críticas

### Disponibilidad de Libros (HU-01)
- ✅ Disponible si sin historial O último estado = RETURNED
- ❌ NO disponible si último estado = ON_LOAN

### Validaciones de Préstamo (HU-02)
- `loan_days` válidos: **7, 14, 21** días únicamente
- Libro debe estar disponible
- Lector no puede tener deuda pendiente (state_debt = PENDING)

### Cálculo de Multa por Retraso (HU-03/04)
Se usa serie de Fibonacci acumulativa por cada semana completa de retraso:

| Días tarde | Semanas | Unidades Fib | Monto |
|-----------|---------|-------------|-------|
| 1-7 | 1 | 1 | $1 |
| 8-14 | 2 | 2 | $2 |
| 15-21 | 3 | 4 | $4 |
| 22-28 | 4 | 7 | $7 |

### Bloqueo de Préstamos (HU-02)
- No se permite préstamo si `state_debt = PENDING`
- Se habilita después de pago completo: `POST /api/v1/debt/pay`

---

## 🛠️ Scripts Disponibles

```bash
npm run dev              # Desarrollo (nodemon, auto-reload)
npm start               # Producción
npm run migrate         # Iniciar BD (local)
npm test                # Tests unitarios + integración
npm run test:coverage   # Reporte de cobertura
```

---

## 🧪 Testing

```bash
npm test                      # Suite completa
npm test -- loanService       # Test específico
npm test -- --watch           # Modo watch
npm run test:coverage         # Con cobertura
```

**Stack**: Jest + Supertest, sin BD real (mocks/fixtures)

---

## 📊 Modelos de Datos

### Tabla: `loan_books`

| Campo | Tipo | Constraint | Descripción |
|-------|------|-----------|-------------|
| `loan_id` | SERIAL | PRIMARY KEY | ID único del préstamo |
| `id_book` | VARCHAR | NOT NULL | ID del libro |
| `title` | VARCHAR | NOT NULL | Título del libro |
| `type_id_reader` | VARCHAR | NOT NULL | Tipo de identificación |
| `id_reader` | VARCHAR | NOT NULL | ID del lector |
| `name_reader` | VARCHAR | NOT NULL | Nombre del lector |
| `loan_days` | INT | CHECK (7,14,21) | Días de préstamo válidos |
| `state` | VARCHAR | ON_LOAN\|RETURNED | Estado actual |
| `date_limit` | DATE | NOT NULL | Fecha máxima devolución |
| `date_return` | DATE | NULL | Fecha de devolución real |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Última actualización |

### Tabla: `debt_reader`

| Campo | Tipo | Constraint | Descripción |
|-------|------|-----------|-------------|
| `id_debt` | SERIAL | PRIMARY KEY | ID único de deuda |
| `loan_id` | INT | FOREIGN KEY | Referencia al préstamo |
| `type_id_reader` | VARCHAR | NOT NULL | Tipo de identificación |
| `id_reader` | VARCHAR | NOT NULL | ID del lector |
| `name_reader` | VARCHAR | NOT NULL | Nombre del lector |
| `amount_debt` | DECIMAL | NOT NULL | Cantidad de deuda |
| `state_debt` | VARCHAR | PENDING\|PAID | Estado de deuda |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Última actualización |

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
docker run -d --name backend-s7 \
  -e DATABASE_URL="postgresql://postgres:postgres@172.17.0.1:5432/postgres" \
  -e PORT=3000 \
  -e NODE_ENV=development \
  -p 3000:3000 \
  backend-s7
```

Para instrucciones completas de inicio, ver [DOCKER_QUICKSTART.md](../S7-Arquitectura/DOCKER_QUICKSTART.md)

---

## 📚 Documentación Relacionada

- [**PRD**](../S7-Arquitectura/PRD.md) - Requisitos del producto
- [**Specs ASDD**](../S7-Arquitectura/.github/specs/) - Especificaciones técnicas por HU
- [**Frontend README**](../S7-Frontend-Sis-Prestamos-y-Multas/README.md) - Documentación del cliente
- [**Docker Quick Start**](../S7-Arquitectura/DOCKER_QUICKSTART.md) - Guía de inicio rápido

---

## 👥 Equipo

- **QA**: Alexander Molina
- **DEV**: Gabriel Perero

---

## 📄 Licencia

ISC
