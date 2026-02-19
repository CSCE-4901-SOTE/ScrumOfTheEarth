-- Corrected schema for Supabase migration
-- Fixed table references and data types

CREATE TABLE user_role (
  role_id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO user_role (name, description) VALUES
('technician','field technician who uses the app to monitor and maintain field devices'),
('farmer','main user who uses the app to observe crop and harvest growth');

CREATE TABLE farmra_user (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role_id INTEGER REFERENCES user_role(role_id) ON DELETE SET NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gateway (
  id BIGINT PRIMARY KEY,
  gateway_name VARCHAR(255),
  gateway_status VARCHAR(255) CHECK (gateway_status IN ('ONLINE','OFFLINE','UNKNOWN'))
);

CREATE TABLE sensor_node (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status VARCHAR(20) NOT NULL,
  rssi INTEGER,
  packet_loss INTEGER,
  battery INTEGER,
  temperature INTEGER,
  moisture INTEGER,
  light INTEGER,
  customer_id UUID REFERENCES farmra_user(user_id) ON DELETE SET NULL,
  technician_id UUID REFERENCES farmra_user(user_id) ON DELETE SET NULL,
  gateway_id BIGINT REFERENCES gateway(id) ON DELETE SET NULL,
  saved_status VARCHAR(20),
  saved_rssi INTEGER,
  saved_packet_loss INTEGER,
  saved_battery INTEGER,
  saved_temperature INTEGER,
  saved_moisture INTEGER,
  saved_light INTEGER
);

CREATE TABLE sensor_reading (
  id BIGINT PRIMARY KEY,
  node_id VARCHAR(32) REFERENCES sensor_node(id) ON DELETE CASCADE,
  reading_timestamp TIMESTAMPTZ DEFAULT NOW(),
  soil_moisture FLOAT,
  soil_temperature FLOAT,
  battery_level NUMERIC(5, 2),
  light_level FLOAT
);