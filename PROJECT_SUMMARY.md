# FarmRa Project - Quick Summary

## What This Project Does

**FarmRa** (by ScrumOfTheEarth team) is a web application that helps farmers monitor soil sensor data across their fields. It provides real-time visualization of sensor conditions and historical trend analysis through a clean, map-based interface.

**Target Users:**
- 👨‍🌾 **Farmers** - Monitor their fields and sensor readings
- 👨‍🔧 **Technicians** - Deploy, maintain, and troubleshoot sensors

---

## Technology Stack at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                  FARMRA ARCHITECTURE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Port 4200)          Backend (Port 8090)     │
│  ├─ Angular 20.3.7            ├─ Spring Boot 3.5.6    │
│  ├─ TypeScript 5.9.3           ├─ Java 17+            │
│  ├─ RxJS 7.8.0                 ├─ Spring Data JPA     │
│  └─ MapLibre GL 5.11.0         └─ Spring Security     │
│                                                         │
│       ↕ REST API (/api/*)                              │
│                                                         │
│           PostgreSQL (Port 5432)                       │
│           ├─ user_role                                 │
│           ├─ farmra_user (farmers & technicians)       │
│           ├─ sensor_node (devices)                     │
│           ├─ sensor_reading (historical data)          │
│           └─ gateway (communication hubs)              │
│                                                         │
│           Hardware IoT Sensors → HTTP POST API         │
│           (via sensorNode.c)                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
ScrumOfTheEarth/
│
├── 📁 frontend/                    # Angular Single Page App
│   ├── src/app/
│   │   ├── map-sensor/            # Main sensor map view
│   │   ├── dashboard/             # User dashboard
│   │   ├── login-page/            # Authentication
│   │   ├── sensor-view/           # Sensor details
│   │   └── [other components]/
│   ├── package.json               # npm dependencies
│   └── angular.json               # Angular config
│
├── 📁 backend/                     # Spring Boot REST API
│   ├── src/main/java/com/sote/FarmRa/
│   │   ├── controller/            # REST endpoints
│   │   ├── service/               # Business logic
│   │   ├── entity/                # Database models
│   │   └── repository/            # Database access
│   ├── migrations/                # Database version control
│   ├── build.gradle.kts           # Gradle config (Primary)
│   ├── pom.xml                    # Maven config (Alternative)
│   └── gradlew/gradlew.bat
│
├── 📁 hardware/                    # IoT Code
│   └── sensors/
│       └── sensorNode.c           # C code for sensor devices
│
├── 📁 docs/
│   └── installingsqlx.md          # Database migration tool guide
│
├── 📄 README.md                    # Original project README
├── 📄 ARCHITECTURE_ANALYSIS.md     # Detailed architecture (CREATED)
├── 📄 LOCAL_SETUP_GUIDE.md         # Step-by-step setup (CREATED)
└── 📄 SUPABASE_MIGRATION_GUIDE.md  # Cloud migration guide (CREATED)
```

---

## Key Features

✅ **User Authentication**
- Role-based access (Farmer vs Technician)
- Session-based login with password hashing

✅ **Real-time Sensor Monitoring**
- Live status: Online/Weak/Offline
- Battery level, signal strength (RSSI), packet loss
- Temperature, moisture, light readings
- Geographic location display

✅ **Historical Data Analysis**
- Sensor reading history (time-series data)
- Trend analysis and graphs
- Historical comparisons

✅ **Map-Based Interface**
- MapLibre GL for sensor visualization
- Geographic coordinates storage
- Sensor status by location

✅ **Role-Based Dashboard**
- Farmers see only their sensors
- Technicians see assigned sensors
- Admin-like access to manage devices

---

## Running Locally (TL;DR)

### Prerequisites
```bash
✓ Node.js 18+        (npm install)
✓ Java 17+           (backend)
✓ PostgreSQL 12+     (database)
✓ sqlx-cli           (migrations)
```

### Quick Start (3 steps)
```bash
# Terminal 1: Database
docker run --name farmra-db \
  -e POSTGRES_DB=farmra \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 -d postgres:15

# Terminal 2: Backend
cd backend
./gradlew bootRun          # Starts on port 8090

# Terminal 3: Frontend
cd frontend
npm install && npm start   # Starts on port 4200
```

Visit: http://localhost:4200

**For detailed setup:** See [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md)

---

## API Endpoints (Current)

```
Spring Boot REST API (http://localhost:8090)

GET    /api/sensors              Get all sensors
GET    /api/sensors/{id}         Get sensor by ID
POST   /api/sensors              Create new sensor
PUT    /api/sensors/{id}         Update sensor
DELETE /api/sensors/{id}         Delete sensor

GET    /api/sensors/status/{status}        Filter by status
GET    /api/sensors/customer/{customerId}  Get farmer's sensors
GET    /api/sensors/technician/{techId}    Get tech's sensors

GET    /api/users                Get all users
POST   /api/users/register       Create user account
POST   /api/users/login          Authenticate user
```

---

## Database Schema

**5 Main Tables:**

```sql
user_role
├─ role_id (PK)
├─ name ("farmer" | "technician")
└─ description

farmra_user  
├─ user_id (UUID, PK)
├─ email (unique)
├─ phone
├─ role_id (FK)
├─ password_hash
└─ created_at

sensor_node
├─ id (VARCHAR, PK) - Hardware identifier
├─ name, latitude, longitude
├─ status (online|weak|offline|deactivate)
├─ metrics (rssi, battery, temperature, moisture, light)
├─ customer_id (FK → farmra_user)
├─ technician_id (FK → farmra_user)
└─ saved_* fields (cached latest values)

sensor_reading
├─ id (BIGINT, PK)
├─ node_id (FK)
├─ reading_timestamp
├─ soil_moisture
├─ soil_temperature
└─ battery_level

gateway
├─ id (BIGINT, PK)
├─ gateway_name
└─ gateway_status
```

---

## Backend Endpoints Detail

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/sensors` | GET | List all sensors | Session |
| `/api/sensors` | POST | Create sensor | Session |
| `/api/sensors/{id}` | GET | Get sensor details | Session |
| `/api/sensors/{id}` | PUT | Update sensor | Session |
| `/api/sensors/{id}` | DELETE | Delete sensor | Session |
| `/api/sensors/customer/{id}` | GET | Get user's sensors | Session |
| `/api/users` | GET | List users | Admin |
| `/api/users/register` | POST | Register account | Public |
| `/api/users/login` | POST | Login | Public |

---

## Current Architecture Strengths ✅

1. **Modern Tech Stack** - Angular 20, Spring Boot 3.5, Java 21
2. **Separation of Concerns** - Frontend/Backend clearly divided
3. **Database Versioning** - sqlx migrations for reproducibility
4. **Security** - Spring Security + password hashing + role-based access
5. **IoT Ready** - REST API for sensor devices to push data
6. **Scalable Design** - PostgreSQL with normalized schema

---

## Current Limitations ⚠️

| Issue | Impact | Solution |
|-------|--------|----------|
| Server maintenance burden | Operations overhead | → Migrate to Supabase |
| No built-in real-time | Polling required | → Use Supabase real-time |
| Manual authentication | More code to maintain | → Use Supabase Auth |
| Limited at scale (single server) | Can't handle thousands of sensors | → Supabase auto-scales |
| HTTPS not configured locally | Security concern for production | → Production deployment |
| No monitoring/logging | Hard to debug issues | → Supabase observability |

---

## Recommended Next Steps

### Short Term (Next Week)
1. ✅ **Complete local development** - Get all components running smoothly
2. ✅ **Add test data** - Populate with realistic sensor data
3. ✅ **Test full flow** - Login → View sensors → Check data

### Medium Term (Next Month)
1. 📋 **Migrate to Supabase** - Eliminate backend infrastructure
2. 🔐 **Implement proper auth** - JWT + secure tokens
3. 📱 **Add real-time updates** - WebSocket sensor feeds
4. 🚀 **Deploy frontend** - Vercel, Netlify, or AWS Amplify

### Long Term (Production)
1. 🔒 **HTTPS/SSL** - Secure all communications
2. 📊 **Monitoring & Logging** - Error tracking & analytics
3. 🧪 **Comprehensive Testing** - Unit + E2E tests
4. 📈 **Performance Optimization** - Caching, CDN, optimization
5. 🌐 **Multi-region deployment** - Global availability

---

## Supabase vs Keeping Spring Boot

### Keep Spring Boot If:
- You need custom business logic
- You want full control over backend
- You have unique security requirements
- Team is experienced with Java/Spring

### Migrate to Supabase If:
- You want to minimize ops burden ✅ (Recommended)
- You need real-time data sync
- You prefer managed PostgreSQL
- You want faster time-to-market
- You're building IoT-heavy application

**Recommendation:** **MIGRATE TO SUPABASE**
- Perfect PostgreSQL compatibility (your exact schema)
- Eliminates backend maintenance
- Built for real-time IoT data
- Better cost scaling for sensor networks

See: [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)

---

## Important Files Reference

| File | Purpose | Read If... |
|------|---------|-----------|
| [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) | Step-by-step local setup | You want to run locally |
| [ARCHITECTURE_ANALYSIS.md](./ARCHITECTURE_ANALYSIS.md) | Detailed technical analysis | You need deep understanding |
| [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) | Cloud migration steps | You want to go serverless |
| [README.md](./README.md) | Original project docs | You need original context |
| [docs/installingsqlx.md](./docs/installingsqlx.md) | Database migration tool | You're working with database |

---

## Common Commands

```bash
# Frontend
cd frontend
npm start                 # Run dev server (port 4200)
npm build                 # Build for production
npm test                  # Run tests

# Backend
cd backend
./gradlew bootRun        # Run locally (port 8090)
./gradlew build          # Build JAR
./gradlew clean          # Clean build

# Database
psql -U postgres -d farmra              # Connect via terminal
sqlx migrate run                         # Apply migrations
sqlx migrate revert                      # Rollback migration
sqlx migrate info                        # Show migration status

# Docker (Optional)
docker start farmra-db                   # Start database
docker stop farmra-db                    # Stop database
docker logs farmra-db                    # View logs
```

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Can't connect to database | See LOCAL_SETUP_GUIDE.md → Troubleshooting |
| Backend won't start | Check Java version: `java -version` |
| Frontend won't load | Ensure backend running on port 8090 |
| Migrations not found | Install sqlx-cli: `cargo install sqlx-cli` |
| CORS errors | Backend CORS already configured for localhost:4200 |

---

## File Summary for Reference

### Documents Created for You:

1. **📄 ARCHITECTURE_ANALYSIS.md** (Detailed)
   - Complete technical breakdown
   - Database schema explanation
   - Current strengths/weaknesses
   - Migration path analysis

2. **📄 LOCAL_SETUP_GUIDE.md** (Practical)
   - Quick start instructions
   - Database setup options
   - Step-by-step startup
   - Troubleshooting guide

3. **📄 SUPABASE_MIGRATION_GUIDE.md** (Optional)
   - Serverless architecture guide
   - Step-by-step migration
   - Code examples
   - Deployment instructions

---

## Contact & Support

For technical questions:
1. Check the generated guides first
2. Review code comments in components
3. Check Spring Boot & Angular official docs
4. Reference the Supabase docs if migrating

---

**Last Updated:** February 16, 2026
**Project Status:** Development/Ready for Local Testing
**Recommended Path:** Local Development → Supabase Migration → Production Deployment

