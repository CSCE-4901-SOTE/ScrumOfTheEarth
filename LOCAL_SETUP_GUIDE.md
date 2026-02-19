# FarmRa Local Development Setup Guide

## Quick Start (5-10 minutes)

### Prerequisites Checklist
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Java 17+ installed (`java -version`)
- [ ] PostgreSQL running locally or Docker installed
- [ ] Git installed

---

## 1. Database Setup (Choose One Option)

### Option A: PostgreSQL Desktop (Easiest for Windows)

```powershell
# 1. Download from: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
# 2. Run installer, remember the postgres password
# 3. Open pgAdmin (included in installer)

# 4. Create new database in pgAdmin:
#    - Right-click "Databases" → Create → Database
#    - Name: farmra
#    - Owner: postgres

# 5. Note your connection details:
#    - Host: localhost
#    - Port: 5432
#    - Database: farmra
#    - User: postgres
#    - Password: [your chosen password]
```

### Option B: Docker (Most Reliable)

```bash
docker run --name farmra-db \
  -e POSTGRES_DB=farmra \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running:
docker ps  # should show farmra-db
```

---

## 2. Setup Backend Database Connection

```bash
# Create .env file in backend/ directory with your database details
cd backend
cat > .env << 'EOF'
DB_IP=localhost
DB_NAME=farmra
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_SCHEMA=public
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/farmra
EOF
```

---

## 3. Run Database Migrations

### Install sqlx-cli (One-time)

**Windows (PowerShell):**
```powershell
# Install Rust first from https://rustup.rs/
# Then in new PowerShell window:
cargo install sqlx-cli --no-default-features --features postgres
```

**macOS/Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install sqlx-cli --no-default-features --features postgres
```

### Apply Migrations

```bash
cd backend

# Verify migrations are found
sqlx migrate info

# Apply all migrations
sqlx migrate run

# Expected output: "Success: 2 migrations run"
```

---

## 4. Start Backend Server

```bash
cd backend

# Using Gradle (recommended)
./gradlew bootRun

# Or using Maven (if preferred)
# mvn spring-boot:run

# Wait for: "Started FarmRaApplication in X seconds"
# Backend running at http://localhost:8090
```

**Keep this terminal running!**

---

## 5. Start Frontend Server (New Terminal)

```bash
cd frontend

# First time only: install dependencies
npm install

# Start development server
npm start

# Angular will open browser at http://localhost:4200
# (If not, navigate manually)
```

**Keep this terminal running!**

---

## 6. Test the Setup

### Test Backend
```bash
# In a new terminal, test the API:
curl http://localhost:8090/api/sensors

# Should return: [] (empty array or error is fine if database is empty)
```

### Test Frontend
- Open http://localhost:4200 in browser
- You should see the login page
- Create a test account (farmer or technician)
- You can now explore the dashboard

---

## Common Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend (Angular) | 4200 | http://localhost:4200 |
| Backend (Spring Boot) | 8090 | http://localhost:8090 |
| PostgreSQL | 5432 | postgresql://localhost:5432 |
| pgAdmin (optional) | 5050 | http://localhost:5050 |

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres -d farmra -c "SELECT NOW();"

# If error, start PostgreSQL:
# Windows: Services → PostgreSQL → Start
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
# Docker: docker start farmra-db
```

### "Port 8090 already in use"
```bash
# Edit backend/src/main/resources/application.properties
# Change: server.port=8090 to server.port=8091
```

### "Cannot find sqlx command"
```bash
# Verify installation:
sqlx --version

# If not found, add to PATH:
# Windows: Add cargo to PATH (set during rustup installation)
# macOS/Linux: source ~/.cargo/env
```

### "npm install fails"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "ng serve not found"
```bash
cd frontend
npm install -g @angular/cli@20
npm start
```

### "CORS error in browser console"
- Make sure backend is running on 8090
- Frontend should be on localhost:4200
- SensorController already has @CrossOrigin configured

---

## File Structure While Running

```
With all servers running, you'll have:

Terminal 1: PostgreSQL (if not Docker)
Terminal 2: Backend - Spring Boot
Terminal 3: Frontend - Angular dev server

File changes:
- Edit frontend files → Auto-reload at http://localhost:4200
- Edit backend files → Requires restart (Ctrl+C, then ./gradlew bootRun)
```

---

## Development Tips

### Make Backend Changes
```bash
# In Terminal 2 (Backend):
# 1. Edit file in backend/src/main/java/com/sote/FarmRa/
# 2. Press Ctrl+C to stop server
# 3. Run: ./gradlew bootRun
# 4. Server restarts automatically
```

### Make Frontend Changes
```bash
# In Terminal 3 (Frontend):
# Just edit frontend/src/app/*.ts or *.html
# Browser auto-refreshes within 2-3 seconds
```

### Add Database Migration
```bash
cd backend
sqlx migrate add name-of-your-migration -r

# Edit the new files in migrations/
# Then run: sqlx migrate run
```

### View Database Contents
```bash
# Option 1: pgAdmin GUI (http://localhost:5050 if running)
# Option 2: psql command line
psql -U postgres -d farmra

# Common queries:
\dt                          # List tables
SELECT * FROM farmra_user;   # View users
\q                           # Exit

# Option 3: DBeaver (recommended)
# Download from: https://dbeaver.io/
# Connect to localhost:5432/farmra
```

---

## Next Steps

1. **Explore the Application:**
   - Login and create user account
   - View dashboard and map
   - Check sensor data (if any)

2. **Understand the Code:**
   - Frontend: `frontend/src/app/map-sensor/sensor.service.ts` - API calls
   - Backend: `backend/src/main/java/com/sote/FarmRa/controller/SensorController.java` - API endpoints

3. **Add Test Data:**
   ```bash
   curl -X POST http://localhost:8090/api/sensors \
     -H "Content-Type: application/json" \
     -d '{
       "id": "SENSOR_001",
       "name": "Test Sensor",
       "latitude": 40.7128,
       "longitude": -74.0060,
       "status": "online",
       "battery": 85
     }'
   ```

4. **When Ready for Production:**
   - Read ARCHITECTURE_ANALYSIS.md for Supabase migration guide
   - Set up HTTPS/SSL
   - Configure proper authentication (JWT)
   - Deploy frontend and backend

---

## Getting Help

Check these files for more details:
- [Root README.md](./README.md) - Project overview
- [Backend README](./backend/README.md) - Backend specific setup
- [Frontend README](./frontend/README.md) - Angular documentation
- [Architecture Analysis](./ARCHITECTURE_ANALYSIS.md) - Detailed architecture
- [sqlx Installation](./docs/installingsqlx.md) - Database migration tool

