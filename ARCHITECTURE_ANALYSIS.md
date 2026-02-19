# FarmRa - Architecture & Infrastructure Analysis

## Project Overview
**FarmRa** is a web application for farmers and field technicians to monitor soil sensor data across their fields. The project is called "Scrum of the Earth" and uses modern full-stack technologies.

---

## Architecture Breakdown

### 1. Frontend Architecture

**Technology Stack:**
- **Framework:** Angular 20.3.7 (Latest)
- **Language:** TypeScript 5.9.3
- **Build System:** Angular CLI with esbuild
- **Server-Side Rendering (SSR):** Enabled via @angular/ssr for better SEO and performance
- **Testing:** Karma + Jasmine for unit tests
- **Dependencies:**
  - Angular platform modules (core, forms, router, platform-browser, platform-server)
  - RxJS 7.8.0 for reactive programming
  - Express 4.18.2 (for SSR)
  - MapLibre GL 5.11.0 (map visualization for sensor locations)

**Project Structure:**
```
frontend/src/app/
├── dashboard/              # Main user dashboard
├── map-sensor/            # Sensor map visualization & data
│   └── sensor.service.ts  # HTTP calls to backend API
├── login-page/            # User authentication
├── signup-page/           # User registration
├── alerts/                # Alert notifications
├── contacts/              # Contact management
├── edit-profile/          # User profile management
├── historical-trends/     # Historical data analytics
├── models/
│   ├── sensor.model.ts    # Sensor data model
│   ├── gateway.model.ts   # Gateway model
│   └── page-results.dto.ts
├── services/              # Shared services
└── app.routes.ts          # Routing configuration
```

**Key Features:**
- Role-based UI (Farmer vs Technician views)
- Responsive design with CSS styling
- Session storage for authentication (userRole, userEmail stored in sessionStorage)
- Map-based sensor visualization using MapLibre GL
- Real-time sensor status monitoring (online/weak/offline)

**API Integration:**
- Base URL: `http://localhost:8080/api/sensors`
- Uses Angular HttpClient for REST API calls
- Cross-origin requests configured for localhost development

---

### 2. Backend Architecture

**Technology Stack:**
- **Framework:** Spring Boot 3.5.6/3.5.7
- **Language:** Java 17/21
- **Build Tool:** Gradle (Kotlin DSL) + Maven support
- **Database:** PostgreSQL (production) / H2 (testing)
- **Security:** Spring Security for authentication/authorization
- **ORM:** Spring Data JPA with Hibernate
- **Other:**
  - Lombok for code generation
  - Connection pooling via HikariCP

**Project Structure:**
```
backend/src/main/java/com/sote/FarmRa/
├── FarmRaApplication.java  # Main entry point
├── config/                  # Spring configuration
├── controller/
│   ├── SensorController     # REST API for sensors
│   ├── UserController       # User management endpoints
│   └── GatewayController    # Gateway management
├── service/
│   ├── SensorService        # Business logic for sensors
│   └── UserService          # User management logic
├── repository/              # JPA repositories (data access)
├── entity/
│   ├── User.java           # User entity (UUID primary key)
│   ├── Sensor.java         # Sensor node entity
│   ├── SensorReading.java  # Historical readings
│   ├── Role.java           # User roles (Farmer, Technician)
│   └── Gateway.java        # Gateway devices
└── model/
    ├── SensorNode.java     # Extended sensor model
    └── SensorReading.java  # Reading snapshots
```

**REST API Endpoints:**
- **Sensors:** `/api/sensors` (GET, POST, PUT, DELETE)
- **Users:** `/api/users` (Authentication, role management)
- **Filters:** By status, customer (farmer), technician, location

**Server Configuration:**
- Port: 8090 (configurable, set in application.properties)
- Address: 0.0.0.0 (accessible from network)
- CORS: Currently allows only `http://localhost:4200`

---

### 3. Database Schema

**PostgreSQL Database Structure:**

```sql
Tables:
├── user_role
│   ├── role_id (SERIAL PK)
│   ├── name (VARCHAR UNIQUE)
│   └── description (TEXT)

├── farmra_user
│   ├── user_id (UUID PK)
│   ├── email (VARCHAR UNIQUE)
│   ├── phone (VARCHAR)
│   ├── role_id (FK → user_role)
│   ├── password_hash (VARCHAR)
│   └── created_at (TIMESTAMPTZ)

├── gateway
│   ├── id (BIGINT PK)
│   ├── gateway_name (VARCHAR)
│   └── gateway_status (VARCHAR: ONLINE/OFFLINE/UNKNOWN)

├── sensor_node
│   ├── id (VARCHAR PK)
│   ├── name, latitude, longitude
│   ├── status (VARCHAR)
│   ├── Technical metrics: rssi, packet_loss, battery
│   ├── Environmental: temperature, moisture, light
│   ├── customer_id (FK → farmra_user)
│   ├── technician_id (FK → farmra_user)
│   └── saved_* fields (historical snapshots)

└── sensor_reading
    ├── id (BIGINT PK)
    ├── node_id (FK → sensor_node)
    ├── reading_timestamp (TIMESTAMPTZ)
    ├── soil_moisture (FLOAT)
    ├── soil_temperature (FLOAT)
    └── battery_level (NUMERIC)
```

**Key Design Patterns:**
- UUID for users (scalable, secure)
- String ID for sensor nodes (hardware identifiers)
- Saved state fields for caching latest readings
- Timestamped readings for historical analysis
- Foreign keys for referential integrity

---

### 4. Database Migrations

**Migration Tool:** sqlx-cli (Rust-based migration manager)

**Current Migrations:**
1. `20251023170710_intial-table-creation.up/down.sql` - Schema creation
2. `20260127182348_updated-sensor-reading.up/down.sql` - Schema updates

**Migration Workflow:**
```bash
sqlx migrate run          # Apply pending migrations
sqlx migrate revert       # Rollback last migration
sqlx migrate add <name>   # Create reversible migration
sqlx migrate info         # List migration status
```

---

## Current Deployment & Execution

### Local Development Setup
1. **Database Setup:**
   - PostgreSQL running locally
   - Environment variables configured in `.env` file
   - Migrations applied via sqlx

2. **Backend (Port 8090):**
   - Java 17+ installed
   - Spring Boot application runs via Gradle/Maven
   - Database connection via HikariCP

3. **Frontend (Port 4200):**
   - Node.js environment
   - Angular dev server
   - Proxy configured for `/api/*` routes to backend

**Environment Variables Needed:**
```properties
DB_IP=localhost
DB_NAME=farmra
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_SCHEMA=public
```

---

## Security Considerations

**Current Status:**
- ✅ Spring Security framework integrated
- ✅ Password hashing in database
- ✅ Role-based access control (Farmer vs Technician)
- ✅ Session-based authentication
- ⚠️ CORS only allows localhost:4200 (development only)
- ⚠️ No HTTPS configured in local setup
- ⚠️ Sensitive data in sessionStorage (best practice: use httpOnly cookies)

---

## Hardware Integration

**Sensor Network:**
- IoT sensor nodes (`sensorNode.c` in hardware/sensors/)
- Gateways that relay data
- Reading frequency: Real-time updates
- Data transmitted to backend API

---

## Recommended Remote Backend Solution: **Supabase**

### Why Supabase Over Firebase?

| Aspect | Supabase | Firebase |
|--------|----------|----------|
| **Database** | PostgreSQL (native) | Firestore (proprietary) |
| **Migrations** | Full support for schema versioning | Limited, schema-less |
| **REST API** | Auto-generated from schema | Custom Firestore SDK |
| **Cost Predictability** | Pay-per-operation | Consumption-based |
| **Data Export** | Easy PostgreSQL dumps | Complex export process |
| **Hardware Integration** | Better for IoT data | Optimized for web/mobile |

### Why It Fits Your Project:

1. **PostgreSQL Compatibility** - Your current schema is PostgreSQL; Supabase *is* PostgreSQL
2. **Zero Migration Pain** - Move your existing schema 1:1 to Supabase
3. **IoT-Friendly** - PostgreSQL handles time-series sensor data efficiently
4. **REST API Generation** - Auto-generates endpoints like your Spring Boot setup
5. **Row-Level Security (RLS)** - Built-in authorization for Farmer/Technician roles
6. **Real-time Subscriptions** - Native WebSocket support for live sensor updates
7. **Cost for Your Use Case** - Pay ~$25/month for starter, scales with data volume

---

## Migration Path to Supabase

### Phase 1: Setup Supabase Project
```bash
# 1. Sign up at supabase.com
# 2. Create new project
# 3. Get connection details
```

### Phase 2: Migrate Database Schema
```bash
# Export current schema
pg_dump -h localhost -U postgres farmra > schema.sql

# Import to Supabase
psql -h supabase-url -U postgres -d postgres < schema.sql
```

### Phase 3: Update Frontend
```typescript
// Replace local API calls with Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://YOUR_PROJECT.supabase.co', 'YOUR_ANON_KEY')

// Your SensorService becomes simpler
```

### Phase 4: Decommission Backend (Optional)
- Keep Spring Boot as edge processing layer, or
- Use Supabase Edge Functions to replace it

---

## Guide: Running the Website Locally

### Prerequisites
- **Node.js** 18+ (for Angular)
- **Java** 17+ (for Spring Boot)
- **PostgreSQL** 12+ (database)
- **sqlx-cli** (migration tool)
- **Git** (version control)

---

### Step 1: Database Setup

**Option A: Windows with PostgreSQL GUI Installer**
```powershell
# 1. Download & install PostgreSQL from https://www.enterprisedb.com/
# 2. Note the password you set for 'postgres' user
# 3. Open pgAdmin (included) to verify installation

# 4. Create database
createdb -U postgres farmra

# 5. Create .env in backend directory
# backend\.env
DB_IP=localhost
DB_NAME=farmra
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_SCHEMA=public
```

**Option B: Windows with WSL2**
```bash
# In WSL2 terminal
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Create database
sudo -u postgres createdb farmra
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
```

**Option C: Docker (Recommended)**
```bash
docker run --name farmra-db \
  -e POSTGRES_DB=farmra \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

---

### Step 2: Install Migration Tool (sqlx-cli)

**Windows:**
```powershell
# Install Rust/Cargo first
# Download from https://rustup.rs/

# Then install sqlx-cli
cargo install sqlx-cli --no-default-features --features postgres

# Verify
sqlx --version
```

**WSL2:**
```bash
sudo apt install rustup
rustup default stable
cargo install sqlx-cli --no-default-features --features postgres

# Add to PATH (~/.bashrc)
export PATH=$PATH:"$HOME/.cargo/bin"
```

---

### Step 3: Run Database Migrations

```bash
# Navigate to backend directory
cd backend

# Verify migrations are recognized
sqlx migrate info

# Apply all pending migrations
sqlx migrate run

# Verify in pgAdmin or psql
psql -U postgres -d farmra -c "\dt"  # List tables
```

---

### Step 4: Start Backend (Spring Boot)

```bash
cd backend

# Option A: Using Gradle
./gradlew bootRun

# Option B: Using Maven
mvn spring-boot:run

# Expected output:
# FarmRa started on port(s): 8090
# http://localhost:8090

# Test with:
curl http://localhost:8090/api/sensors
```

---

### Step 5: Start Frontend (Angular)

**In new terminal window:**
```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm start

# Browser will open at http://localhost:4200
# If not, navigate manually and login
```

---

### Step 6: Test the Application

**Test Endpoints:**

```bash
# Backend health check
curl http://localhost:8090/api/sensors

# Get all sensors
curl http://localhost:8090/api/sensors

# Create test sensor
curl -X POST http://localhost:8090/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "id": "SENSOR_001",
    "name": "Field A - North",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "status": "online",
    "battery": 85
  }'
```

**Frontend:**
- Navigate to http://localhost:4200
- Create account (farmer or technician)
- View dashboard
- Check map for sensor locations

---

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection refused | Verify PostgreSQL is running: `psql -U postgres` |
| Port 8090 already in use | Change in `application.properties`: `server.port=8091` |
| Frontend won't connect to backend | Check CORS: Ensure `@CrossOrigin(origins = "http://localhost:4200")` |
| Migration files not found | Verify sqlx database URL: `DATABASE_URL=postgresql://user:pass@localhost/farmra` |
| Node modules not installing | Delete `node_modules/` and `package-lock.json`, run `npm install` again |
| Java version mismatch | Check: `java -version`, install Java 17+: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html |

---

### Development Workflow

**Terminal 1 - Database (if using Docker):**
```bash
docker start farmra-db
```

**Terminal 2 - Backend:**
```bash
cd backend
./gradlew bootRun
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

Visit: http://localhost:4200

---

## Next Steps for Production

### Before Moving to Supabase:
1. ✅ Complete local development and testing
2. ✅ Add proper authentication (JWT tokens instead of sessionStorage)
3. ✅ Implement HTTPS/SSL
4. ✅ Add API rate limiting and request validation
5. ✅ Create comprehensive API documentation
6. ✅ Set up CI/CD pipeline (GitHub Actions)

### Supabase Migration:
1. Create Supabase project
2. Migrate schema
3. Update frontend API calls
4. Deploy frontend to Vercel/Netlify
5. Set up Supabase Edge Functions for real-time sensor processing
6. Configure IoT device → Supabase REST API integration

---

## File Structure Summary

```
ScrumOfTheEarth/
├── frontend/                  # Angular SPA
│   ├── package.json
│   ├── angular.json
│   ├── src/
│   │   ├── main.ts (Bootstrap)
│   │   ├── app/ (Components & Services)
│   │   └── styles.css
│   └── dist/ (Build output)
│
├── backend/                   # Spring Boot REST API
│   ├── pom.xml & build.gradle.kts (Dual build system)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sote/FarmRa/
│   │   │   └── resources/application.properties
│   │   └── test/
│   ├── migrations/ (Database versioning)
│   └── gradlew/gradlew.bat (Gradle wrapper)
│
├── hardware/                  # IoT Sensor Code
│   └── sensors/sensorNode.c
│
├── docs/                      # Documentation
│   └── installingsqlx.md
│
└── README.md & package.json (Root configs)
```

---

## Summary

**Current State:** Full-stack web application with:
- Modern Angular frontend with real-time maps
- Spring Boot REST API backend
- PostgreSQL relational database
- IoT sensor integration

**Recommended Path Forward:** Migrate to Supabase for:
- Simplified infrastructure (no backend server maintenance)
- Native PostgreSQL compatibility
- Built-in authentication & real-time updates
- Better cost predictability for IoT workloads
- Focus development on frontend and hardware integration

**Local Development:** All components runnable on a single machine with proper configuration of database, backend, and frontend servers.
