# Supabase Migration Guide for FarmRa

## Why Supabase?

Your current architecture uses:
- ✅ **PostgreSQL** - Supabase IS PostgreSQL (managed)
- ✅ **REST API** - Supabase auto-generates from schema
- ✅ **Row-Level Security** - Perfect for Farmer/Technician roles
- ✅ **Real-time** - WebSocket subscriptions for sensor updates
- ✅ **Authentication** - Built-in JWT with Row-Level Security

**Benefits:**
- Eliminate Spring Boot backend maintenance
- Keep all your PostgreSQL schema intact
- Reduce ops complexity
- Better for IoT/sensor data at scale
- Cost: ~$25/month starter tier (vs. server costs)

---

## Phase 1: Supabase Project Setup

### Step 1: Create Supabase Account
1. Go to https://supabase.com/
2. Click "Start your project" 
3. Sign up with GitHub or email
4. Create new organization (or use default)

### Step 2: Create New Project

**In Supabase Dashboard:**
1. Click "New project"
2. **Project name:** FarmRa
3. **Database password:** (save this!)
4. **Region:** Select closest to your users/servers
5. Click "Create new project"

⏳ Wait 3-5 minutes for project to initialize...

### Step 3: Get Connection Details

After project is ready, go to **Settings → Database**:

```
Connection Info:
- Host: [PROJECT].supabase.co
- Port: 5432
- Database: postgres
- User: postgres
- Password: [You set this]
- Anon Key: [Found in Settings → API Keys]
- Service Role Key: [Found in Settings → API Keys]
- Project URL: https://[PROJECT].supabase.co
```

**Save these credentials securely!**

---

## Phase 2: Migrate Database Schema

### Option A: pg_dump + psql (Recommended)

**From your local machine:**

```bash
# Step 1: Export your current PostgreSQL schema
pg_dump -h localhost \
  -U postgres \
  -d farmra \
  --schema-only \
  --no-owner \
  --no-privileges \
  > farmra_schema.sql

# This exports ONLY the schema (no data yet)
```

**Edit the exported file:**

```bash
# Open farmra_schema.sql and:
# 1. Remove any CREATE EXTENSION lines (Supabase handles these)
# 2. Remove COMMENT ON SCHEMA public statements
# 3. Save and close
```

**Import to Supabase:**

```bash
# Step 2: Connect to Supabase and import schema
psql -h [YOUR_PROJECT].supabase.co \
  -U postgres \
  -d postgres \
  -f farmra_schema.sql

# When prompted for password, use the database password you set
```

**Verify import:**

```bash
psql -h [YOUR_PROJECT].supabase.co \
  -U postgres \
  -d postgres \
  -c "\dt"  # List tables - should show all your tables

# Expected output:
# user_role | table | postgres
# farmra_user | table | postgres
# gateway | table | postgres
# sensor_node | table | postgres
# sensor_reading | table | postgres
```

### Option B: SQL Editor in Supabase (Manual)

If pg_dump doesn't work:

1. Go to **SQL Editor** in Supabase dashboard
2. Create new query
3. Copy each CREATE TABLE statement from your migrations
4. Execute in order

---

## Phase 3: Set Up Row-Level Security (RLS)

This allows Farmers to see only their sensors and Technicians to see assigned sensors.

### Enable RLS on Tables

**In SQL Editor, run:**

```sql
-- Enable RLS on all tables
ALTER TABLE farmra_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_reading ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own data
CREATE POLICY "Users can view own data"
ON farmra_user
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Create policy: Farmers see only their sensors
CREATE POLICY "Farmers see own sensors"
ON sensor_node
FOR SELECT
USING (customer_id = auth.uid());

-- Create policy: Technicians see assigned sensors
CREATE POLICY "Technicians see assigned sensors"
ON sensor_node
FOR SELECT
USING (technician_id = auth.uid());

-- Create policy: Everyone can read sensor readings
CREATE POLICY "Users can read sensor readings"
ON sensor_reading
FOR SELECT
USING (true);
```

---

## Phase 4: Update Frontend Code

### Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

### Create Supabase Service

**frontend/src/app/services/supabase.service.ts:**

```typescript
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://YOUR_PROJECT.supabase.co',
      'YOUR_ANON_KEY'  // Get from Settings → API Keys
    );
  }

  // Authentication
  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  // Get current user
  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  // Sensors - Replace your HTTP calls
  async getSensors() {
    const { data, error } = await this.supabase
      .from('sensor_node')
      .select('*')
      .order('name');
    return { data, error };
  }

  async getSensorById(id: string) {
    const { data, error } = await this.supabase
      .from('sensor_node')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  }

  async updateSensor(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('sensor_node')
      .update(updates)
      .eq('id', id);
    return { data, error };
  }

  // Sensor Readings
  async getReadings(sensorId: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('sensor_reading')
      .select('*')
      .eq('node_id', sensorId)
      .order('reading_timestamp', { ascending: false })
      .limit(limit);
    return { data, error };
  }

  // Real-time subscriptions
  subscribeToSensor(sensorId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`sensor:${sensorId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sensor_node', filter: `id=eq.${sensorId}` },
        callback
      )
      .subscribe();
  }
}
```

### Update SensorService

**Replace HTTP calls in frontend/src/app/map-sensor/sensor.service.ts:**

```typescript
// OLD (HTTP-based):
// private readonly baseUrl = 'http://localhost:8080/api/sensors';
// constructor(private http: HttpClient) {}

// NEW (Supabase):
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class SensorService {
  constructor(private supabase: SupabaseService) {}

  async getAllSensors(): Promise<Sensor[]> {
    const { data, error } = await this.supabase.getSensors();
    if (error) throw error;
    return data || [];
  }

  async getSensorById(id: string): Promise<Sensor> {
    const { data, error } = await this.supabase.getSensorById(id);
    if (error) throw error;
    return data;
  }

  async updateSensor(id: string, sensor: Partial<Sensor>) {
    return await this.supabase.updateSensor(id, sensor);
  }

  // Real-time updates
  onSensorUpdate(sensorId: string, callback: (sensor: Sensor) => void) {
    this.supabase.subscribeToSensor(sensorId, (payload) => {
      callback(payload.new);
    });
  }
}
```

### Update Components to Use Async/Await

**Example: dashboard.component.ts**

```typescript
// OLD (Observable-based):
// this.sensorService.getSensors().subscribe(sensors => {
//   this.sensors = sensors;
// });

// NEW (Async/Await with Supabase):
async ngOnInit() {
  try {
    this.sensors = await this.sensorService.getAllSensors();
    
    // Subscribe to real-time updates
    if (this.sensors.length > 0) {
      this.sensorService.onSensorUpdate(this.sensors[0].id, (sensor) => {
        const index = this.sensors.findIndex(s => s.id === sensor.id);
        if (index !== -1) {
          this.sensors[index] = sensor;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load sensors:', error);
  }
}
```

---

## Phase 5: Update Configuration

### Environment Variables

**Create .env files:**

**frontend/.env.production:**
```
NG_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NG_APP_SUPABASE_KEY=YOUR_ANON_KEY
```

**frontend/.env.development:**
```
NG_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NG_APP_SUPABASE_KEY=YOUR_ANON_KEY
```

### Update Angular Configuration

**frontend/src/main.ts:**
```typescript
// Add environment support
import { environment } from './environments/environment';
```

---

## Phase 6: Test the Migration

### 1. Local Testing with Supabase

```bash
cd frontend
npm install
npm start

# Open http://localhost:4200
# Test:
# - Login (new users auto-created)
# - View sensors (should be empty or show test data)
# - Create/update sensors
```

### 2. Verify Row-Level Security

```bash
# Test that users only see their data
# Create two users and verify one can't see other's sensors
```

### 3. Real-time Updates

```typescript
// In browser console, create two tabs:
// Tab 1: View sensor
// Tab 2: Update sensor via Supabase
// Tab 1 should auto-update!
```

---

## Phase 7: Deploy Frontend

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
cd frontend
vercel

# Follow prompts:
# - Link to existing Vercel project? (create new if first time)
# - Framework: Angular
# - Build command: ng build
# - Output directory: dist/sote-angular

# Set environment variables in Vercel dashboard:
# NG_APP_SUPABASE_URL=https://...
# NG_APP_SUPABASE_KEY=...
```

### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

cd frontend
netlify deploy --prod

# Configure build settings:
# - Build command: ng build
# - Publish directory: dist/sote-angular
# - Environment: Set Supabase keys
```

### Option C: AWS Amplify

```bash
npm install -g @aws-amplify/cli
amplify init
amplify hosting add
amplify publish
```

---

## Phase 8: Optional - Migrate Data

If you already have sensor/user data:

```bash
# Export data from local PostgreSQL
pg_dump -h localhost \
  -U postgres \
  -d farmra \
  --data-only \
  > farmra_data.sql

# Import to Supabase
psql -h [PROJECT].supabase.co \
  -U postgres \
  -d postgres \
  < farmra_data.sql
```

---

## Phase 9: Decommission Spring Boot (Optional)

You can now:
1. Stop running the local Spring Boot backend
2. Delete backend/ directory (if desired)
3. Or keep it as an edge processing layer for IoT data

**If keeping backend for IoT ingestion:**

Create endpoint that writes directly to Supabase:

```java
// Backend receives sensor data from IoT devices
// Instead of storing locally, writes to Supabase PostgreSQL
import java.sql.Connection;
import org.postgresql.ds.PGSimpleDataSource;

PGSimpleDataSource ds = new PGSimpleDataSource();
ds.setServerName("[PROJECT].supabase.co");
ds.setDatabaseName("postgres");
ds.setUser("postgres");
ds.setPassword("[PASSWORD]");
ds.setPort(5432);
ds.setSslMode("require");

Connection conn = ds.getConnection();
// Execute INSERT statements to Supabase
```

---

## Troubleshooting

### Issue: "Invalid API key"
- **Solution:** Check you're using ANON_KEY, not SERVICE_ROLE_KEY
- Location: Settings → API Keys → Project API Keys

### Issue: "Row level security violation"
- **Solution:** Check RLS policies are correctly configured
- Verify user is authenticated before making requests
- Check `auth.uid()` is returning expected user ID

### Issue: "CORS error when calling Supabase"
- **Solution:** Supabase handles CORS automatically
- Ensure you're using the correct Anon Key
- Check browser console for specific error

### Issue: "Migrations didn't import correctly"
- **Solution:** 
  1. Check for CREATE EXTENSION statements (remove these)
  2. Manually create tables via SQL Editor
  3. Verify table names match exactly (check quotes)

### Issue: "Real-time updates not working"
- **Solution:**
  1. Ensure RLS is enabled on tables
  2. Check policies allow SELECT operations
  3. Verify subscription is active before making changes
  4. Check Supabase dashboard → Realtime → Replication settings

---

## Cost Estimation

| Tier | Cost/Month | Included |
|------|-----------|----------|
| Free | $0 | 500MB DB, 2GB bandwidth, basic support |
| Pro | $25 | 8GB DB, 50GB bandwidth, real-time, email support |
| Team | $599+ | Custom resources, dedicated support |

**For your project:**
- Start Free tier for development
- Move to Pro when in production
- Monitor bandwidth usage (sensor data ingestion)

---

## Checklist

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Export and import database schema
- [ ] Set up Row-Level Security policies
- [ ] Install Supabase JS client in frontend
- [ ] Create SupabaseService
- [ ] Update SensorService to use Supabase
- [ ] Update components to use async/await
- [ ] Test authentication flow
- [ ] Test real-time updates
- [ ] Test sensor CRUD operations
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set environment variables in hosting
- [ ] Test from production URL
- [ ] Migrate historical data (if needed)
- [ ] Decommission Spring Boot backend (optional)

---

## Next Steps

After migrating to Supabase:

1. **Add Supabase Functions** for:
   - Processing sensor readings in real-time
   - Sending alerts when thresholds exceeded
   - Cleaning up old data automatically

2. **Setup Monitoring:**
   - Supabase Dashboard → Database → Logs
   - Monitor query performance
   - Track usage trends

3. **Automate IoT Ingestion:**
   - Update sensor devices to send data directly to Supabase REST API
   - Use Supabase Functions to process batch uploads

4. **Advanced Features:**
   - Time-series data analysis
   - Historical trend reports
   - Email/SMS alerts
   - Mobile app with native Supabase integration

