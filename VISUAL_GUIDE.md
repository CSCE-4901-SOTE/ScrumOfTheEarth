# FarmRa - Visual Architecture & Data Flow Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FARMRA COMPLETE SYSTEM                         │
└─────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────────┐
                        │   Browser (Port 4200)   │
                        │                         │
                        │  ┌────────────────────┐ │
                        │  │  Angular 20 SPA    │ │
                        │  │                    │ │
                        │  │ Components:       │ │
                        │  │ • Login Page      │ │
                        │  │ • Map Sensor      │ │
                        │  │ • Dashboard       │ │
                        │  │ • Alerts          │ │
                        │  │ • Historical      │ │
                        │  │ • Edit Profile    │ │
                        │  └────────────────────┘ │
                        │          ↕ REST API    │
                        │  http://localhost:8090 │
                        └────────────┬────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
        ┌───────────▼─────────────┐        ┌────────▼──────────┐
        │  Spring Boot Server     │        │  IoT Devices/    │
        │  (Port 8090)            │        │  Hardware Sensors│
        │                         │        │                  │
        │ ┌─────────────────────┐ │        │ sensorNode.c     │
        │ │ Controllers:        │ │        │                  │
        │ │ • SensorController  │ │        │ Sends HTTP POST: │
        │ │ • UserController    │ │        │ {sensor_data}    │
        │ │ • GatewayController │ │        └──────────────────┘
        │ │                     │ │
        │ │ Services:          │ │
        │ │ • SensorService    │ │
        │ │ • UserService      │ │
        │ │                     │ │
        │ │ Repositories:      │ │
        │ │ (JPA data access) │ │
        │ └─────────────────────┘ │
        │          ↕              │
        │   Spring Security       │
        │   Spring Data JPA       │
        └───────────┬─────────────┘
                    │
                    ↓
        ┌───────────────────────────┐
        │   PostgreSQL Database     │
        │   (Port 5432)             │
        │                           │
        │ ┌──────────────────────┐  │
        │ │ user_role            │  │ Stores:
        │ │ • role_id (PK)       │  │ • Farmer
        │ │ • name               │  │ • Technician
        │ └──────────────────────┘  │
        │                           │
        │ ┌──────────────────────┐  │
        │ │ farmra_user          │  │ Stores:
        │ │ • user_id (UUID)     │  │ • Email
        │ │ • password_hash      │  │ • Phone
        │ │ • role_id (FK)       │  │ • Created at
        │ │ • created_at         │  │
        │ └──────────────────────┘  │
        │                           │
        │ ┌──────────────────────┐  │
        │ │ gateway              │  │ Stores:
        │ │ • id (PK)            │  │ • Gateway name
        │ │ • gateway_status     │  │ • Status
        │ └──────────────────────┘  │
        │                           │
        │ ┌──────────────────────┐  │
        │ │ sensor_node          │  │ Stores:
        │ │ • id (String PK)     │  │ • Location
        │ │ • name               │  │ • Status
        │ │ • latitude/longitude │  │ • Metrics
        │ │ • customer_id (FK)   │  │ • Tech ID
        │ │ • status             │  │ • Battery, RSSI
        │ │ • rssi, battery      │  │ • Temperature
        │ │ • temperature        │  │ • Moisture
        │ │ • moisture           │  │ • Light
        │ │ • light              │  │
        │ │ • saved_* fields     │  │
        │ └──────────────────────┘  │
        │                           │
        │ ┌──────────────────────┐  │
        │ │ sensor_reading       │  │ Stores:
        │ │ • id (BIGINT PK)     │  │ • Node ID (FK)
        │ │ • node_id (FK)       │  │ • Timestamp
        │ │ • reading_timestamp  │  │ • Soil moisture
        │ │ • soil_moisture      │  │ • Soil temp
        │ │ • soil_temperature   │  │ • Battery level
        │ │ • battery_level      │  │
        │ └──────────────────────┘  │
        │                           │
        └───────────────────────────┘
```

---

## Data Flow - User Login

```
User Browser
    │
    │ 1. Enter email/password
    ▼
┌─────────────────────┐
│  Login Page (Angular)
│  • Form validation
│  • HTTP POST request
└──────────┬──────────┘
           │
           │ POST /api/users/login
           │ {email, password}
           ▼
   ┌───────────────────┐
   │ UserController    │
   │ loginUser()       │
   └────────┬──────────┘
            │
            ▼
   ┌───────────────────┐
   │ UserService       │
   │ authenticate()    │
   │ • Check email     │
   │ • Verify password │
   │ • Create session  │
   └────────┬──────────┘
            │
            ▼
   ┌───────────────────┐
   │ PostgreSQL        │
   │ Query:            │
   │ SELECT * FROM     │
   │ farmra_user       │
   │ WHERE email = ?   │
   └────────┬──────────┘
            │
            ▼ User data + role
   ┌───────────────────┐
   │ SessionStorage    │
   │ • userEmail       │
   │ • userRole        │
   │ • userID          │
   └────────┬──────────┘
            │
            ▼ Redirect to dashboard
   ┌───────────────────┐
   │ Dashboard View    │
   │ (role-based UI)   │
   └───────────────────┘
```

---

## Data Flow - Load Sensors

```
User navigates to /map-sensor
    │
    ▼
┌──────────────────────┐
│ MapSensorComponent   │
│ ngOnInit()           │
└──────────┬───────────┘
           │
           │ this.sensorService.getSensors()
           ▼
┌──────────────────────┐
│ SensorService        │
│ (Frontend)           │
│                      │
│ GET /api/sensors     │
└──────────┬───────────┘
           │
           │ HTTP GET
           ▼
┌──────────────────────┐
│ SensorController     │
│ getAll()             │
└──────────┬───────────┘
           │
           │ sensorRepository.findAll()
           ▼
┌──────────────────────┐
│ SensorRepository     │
│ (Spring Data JPA)    │
└──────────┬───────────┘
           │
           │ SELECT * FROM sensor_node
           ▼
┌──────────────────────┐
│ PostgreSQL           │
│ sensor_node table    │
└──────────┬───────────┘
           │
           ▼ List<Sensor>
┌──────────────────────┐
│ JSON Response        │
│ [                    │
│   {                  │
│     id: "SENSOR_001",│
│     name: "Field A", │
│     latitude: 40.71, │
│     longitude: -74.0,│
│     status: "online",│
│     battery: 85,     │
│     ...              │
│   },                 │
│   { ... }            │
│ ]                    │
└──────────┬───────────┘
           │
           ▼ Parse JSON
┌──────────────────────┐
│ Frontend             │
│ this.sensors array   │
│ (ready for UI)       │
└──────────┬───────────┘
           │
           ▼ Render
┌──────────────────────┐
│ MapLibre GL Map      │
│ • Plot sensors       │
│ • Show status        │
│ • Display info       │
└──────────────────────┘
```

---

## Data Flow - Update Sensor Reading

```
IoT Sensor Device
    │
    │ Reads: temperature, moisture, battery
    │ Collects: RSSI, packet loss
    │
    ▼
HTTP POST to Spring Boot
POST /api/sensors/{id}
{
  "temperature": 22.5,
  "moisture": 65,
  "battery": 78,
  "rssi": -72,
  "packetLoss": 2
}
    │
    ▼
┌──────────────────────┐
│ SensorController     │
│ update()             │
└──────────┬───────────┘
           │
           │ sensorRepository.findById(id)
           │ sensor.setTemperature(22.5)
           │ sensorRepository.save(sensor)
           ▼
┌──────────────────────┐
│ PostgreSQL           │
│                      │
│ UPDATE sensor_node   │
│ SET temperature=22.5,│
│     moisture=65,     │
│     battery=78,      │
│     rssi=-72,        │
│     packetLoss=2     │
│ WHERE id='SENSOR_001'│
└──────────┬───────────┘
           │
           ▼ Row updated
┌──────────────────────┐
│ INSERT INTO          │
│ sensor_reading       │
│ (node_id,            │
│  reading_timestamp,  │
│  soil_moisture,      │
│  soil_temperature,   │
│  battery_level)      │
│ VALUES(...)          │
└──────────┬───────────┘
           │
           ▼ Success response
┌──────────────────────┐
│ IoT Device           │
│ (logs success)       │
└──────────────────────┘

Later:
    │
    ▼
User's Browser
    │
    │ (Auto-refresh or websocket)
    │
    ▼
┌──────────────────────┐
│ New sensor reading   │
│ displayed on map     │
└──────────────────────┘
```

---

## Authentication & Authorization Flow

```
┌─────────────────────────────────┐
│  Spring Security Chain          │
└─────────────────────────────────┘
          │
          ▼
   1. Request arrives
      (HTTP method, path, session)
          │
          ▼
   2. SessionFilter
      • Check sessionStorage
      • Validate session
          │
    ┌─────┴─────┐
    │           │
   YES         NO
    │           │
    │      Redirect to
    │      /login-page
    │
    ▼
 3. Check User Role
    • Get from database
    • Farmer vs Technician
    │
    ┌──────────┬──────────┐
    │          │          │
 FARMER   TECHNICIAN    ADMIN
    │          │          │
    ▼          ▼          ▼
Show own   Show        Show all
sensors    assigned    sensors
only       sensors

4. Row-Level Security (Future: Supabase)
   ├─ Farmers can only see their sensors
   ├─ Technicians see assigned sensors
   ├─ Only sensors with matching user_id
   └─ Query filtered at database level
```

---

## Frontend Component Hierarchy

```
┌─────────────────────────────────────┐
│      App Root Component             │
│  (app.component.ts)                 │
│                                     │
│  ├─ Navigation Bar                  │
│  │  ├─ Logo                         │
│  │  ├─ Menu (role-based)            │
│  │  └─ User Profile Link            │
│  │                                  │
│  └─ Router Outlet                   │
│     (Renders child components)      │
│     │                               │
│     ├─ /login-page                  │
│     │   └─ LoginPageComponent       │
│     │       • Email input           │
│     │       • Password input        │
│     │       • Submit button         │
│     │       • Link to signup        │
│     │                               │
│     ├─ /signup-page                 │
│     │   └─ SignupPageComponent      │
│     │       • Email input           │
│     │       • Phone input           │
│     │       • Password input        │
│     │       • Role selection        │
│     │                               │
│     ├─ /dashboard                   │
│     │   └─ DashboardComponent       │
│     │       • User greeting         │
│     │       • Statistics            │
│     │       • Quick links           │
│     │                               │
│     ├─ /map-sensor                  │
│     │   └─ MapSensorComponent       │
│     │       • MapLibre GL map       │
│     │       • Sensor markers        │
│     │       • Status icons          │
│     │       • Sensor list           │
│     │       • Sensor detail panel   │
│     │       │                       │
│     │       └─ Uses: SensorService  │
│     │           • GET /api/sensors  │
│     │           • PUT /api/sensors  │
│     │           • Real-time sub     │
│     │                               │
│     ├─ /historical-trends           │
│     │   └─ HistoricalTrendsComponent
│     │       • Time range picker     │
│     │       • Chart library         │
│     │       • Data analysis         │
│     │                               │
│     ├─ /alerts                      │
│     │   └─ AlertsComponent          │
│     │       • Alert list            │
│     │       • Threshold settings    │
│     │       • Notification config   │
│     │                               │
│     ├─ /contacts                    │
│     │   └─ ContactsComponent        │
│     │       • Support contacts      │
│     │       • Farmer directory      │
│     │                               │
│     ├─ /sensor-view                 │
│     │   └─ SensorViewComponent      │
│     │       • Sensor details        │
│     │       • Real-time data        │
│     │       • Historical readings   │
│     │                               │
│     └─ /edit-profile                │
│         └─ EditProfileComponent    │
│             • Name field            │
│             • Phone field           │
│             • Password change       │
│             • Save button           │
│                                     │
└─────────────────────────────────────┘

Shared Services:
├─ SensorService
│  ├─ getAllSensors()
│  ├─ getSensorById()
│  ├─ updateSensor()
│  └─ subscribeToSensor()
│
├─ UserService (implied)
│  ├─ register()
│  ├─ login()
│  └─ getCurrentUser()
│
└─ HttpClient (Angular Core)
   └─ Interceptors (auth, CORS, etc.)
```

---

## Backend Controller & Service Structure

```
┌─────────────────────────────────────┐
│     REST API Endpoints              │
│     (SensorController)              │
└─────────────────────────────────────┘
        │
        ├─ GET /api/sensors
        │   └─→ getAll()
        │       └─→ sensorRepository.findAll()
        │           └─→ SELECT * FROM sensor_node
        │
        ├─ GET /api/sensors/{id}
        │   └─→ getById(id)
        │       └─→ sensorRepository.findById(id)
        │           └─→ SELECT * FROM sensor_node WHERE id=?
        │
        ├─ POST /api/sensors
        │   └─→ create(Sensor)
        │       └─→ sensorRepository.save(sensor)
        │           └─→ INSERT INTO sensor_node
        │
        ├─ PUT /api/sensors/{id}
        │   └─→ update(id, Sensor)
        │       └─→ sensorRepository.save(sensor)
        │           └─→ UPDATE sensor_node SET ...
        │
        ├─ DELETE /api/sensors/{id}
        │   └─→ delete(id)
        │       └─→ sensorRepository.deleteById(id)
        │           └─→ DELETE FROM sensor_node
        │
        └─ GET /api/sensors/customer/{customerId}
            └─→ getByCustomer(customerId)
                └─→ sensorRepository.findByCustomer_UserId(id)
                    └─→ SELECT * WHERE customer_id=?

┌─────────────────────────────────────┐
│     Business Logic Layer            │
│     (SensorService)                 │
└─────────────────────────────────────┘
        │
        ├─ Process sensor readings
        ├─ Calculate derived fields
        ├─ Handle status updates
        ├─ Trigger notifications
        └─ Cache management

┌─────────────────────────────────────┐
│     Data Access Layer               │
│     (SensorRepository)              │
│     extends JpaRepository           │
└─────────────────────────────────────┘
        │
        └─→ Hibernate ORM
            └─→ JDBC
                └─→ PostgreSQL Driver
                    └─→ SQL Execution

┌─────────────────────────────────────┐
│     Entity Models                   │
│     (JPA @Entity classes)           │
└─────────────────────────────────────┘
        │
        ├─ Sensor.java
        ├─ SensorNode.java
        ├─ SensorReading.java
        ├─ User.java
        ├─ Role.java
        └─ Gateway.java
```

---

## Database Query Examples

```sql
-- Get all sensors for a farmer
SELECT s.* FROM sensor_node s
WHERE s.customer_id = '12345-uuid';

-- Get sensor readings for the last 7 days
SELECT * FROM sensor_reading
WHERE node_id = 'SENSOR_001'
  AND reading_timestamp > NOW() - INTERVAL '7 days'
ORDER BY reading_timestamp DESC;

-- Find offline sensors
SELECT s.* FROM sensor_node s
WHERE s.status = 'offline'
  AND s.customer_id = '12345-uuid';

-- Get high temperature alerts
SELECT s.*, sr.soil_temperature FROM sensor_node s
LEFT JOIN sensor_reading sr ON s.id = sr.node_id
WHERE s.customer_id = '12345-uuid'
  AND sr.soil_temperature > 35
ORDER BY sr.reading_timestamp DESC
LIMIT 10;

-- User authentication
SELECT u.*, r.name as role FROM farmra_user u
LEFT JOIN user_role r ON u.role_id = r.role_id
WHERE u.email = 'farmer@example.com'
  AND u.password_hash = crypt('password', u.password_hash);
```

---

## Environment Configuration

```
┌─────────────────────────────────────┐
│  Development Environment            │
├─────────────────────────────────────┤
│ .env (Backend)                      │
│ ├─ DB_IP=localhost                  │
│ ├─ DB_NAME=farmra                   │
│ ├─ DB_USERNAME=postgres             │
│ ├─ DB_PASSWORD=postgres123          │
│ ├─ DB_SCHEMA=public                 │
│ └─ DATABASE_URL=postgresql://...    │
│                                     │
│ .env (Frontend - Angular)           │
│ ├─ NG_APP_API_URL=localhost:8090   │
│ └─ NG_APP_ENV=development           │
│                                     │
│ application.properties (Backend)    │
│ ├─ spring.datasource.url            │
│ ├─ spring.datasource.username       │
│ ├─ spring.datasource.password       │
│ ├─ server.port=8090                 │
│ ├─ server.address=0.0.0.0           │
│ └─ spring.jpa.hibernate.ddl-auto    │
│                                     │
└─────────────────────────────────────┘
```

---

## Migration to Supabase Architecture

```
CURRENT (Local)               AFTER SUPABASE
─────────────────────────────────────────────────────
Browser (4200)            Browser (hosted URL)
    ↓                           ↓
Spring Boot (8090)   ──→  (Eliminated)
    ↓                           ↓
PostgreSQL (5432)    ──→  Supabase PostgreSQL
                          (managed)
                               ↓
                          Auto-generated
                          REST API
                               ↓
                          Row-Level Security
                          Policies
                               ↓
                          Real-time
                          Subscriptions


DATA FLOW CHANGE:
─────────────────

Current (Polling):
Frontend → Spring Boot (long polling) → Database

After Supabase:
Frontend → Supabase REST API
         ↕
         WebSocket (real-time)
         ↓
         Supabase Database
```

---

## Deployment Architecture

```
LOCAL DEVELOPMENT        PRODUCTION (Recommended)
─────────────────────────────────────────────

User Laptop             Global Users
    │                        │
    ├─ http://4200          ├─ https://yoursite.com
    │   (Angular)           │   (Vercel/Netlify CDN)
    │                       │
    ├─ http://8090          ├─ (Eliminated)
    │   (Spring Boot)       │
    │                       │
    ├─ localhost:5432       ├─ Supabase Database
    │   (PostgreSQL)        │   (Auto-scaling)
    │                       │
    └─ Manual migration     └─ CI/CD Pipeline
       via sqlx-cli            (GitHub Actions)

API Calls:
localhost:8090/api → https://project.supabase.co/rest/v1
```

---

This visual guide should help you understand:
- How components communicate
- Data flow from UI to database
- Authentication and authorization
- The role of each technology
- Migration path to Supabase

