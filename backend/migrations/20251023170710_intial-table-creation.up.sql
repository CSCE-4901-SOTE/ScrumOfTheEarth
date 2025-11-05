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
  id bigint not null,
  gateway_name VARCHAR(255),
  gateway_status VARCHAR(255) check (gateway_status in ('ONLINE','OFFLINE','UNKNOWN')),

  primary key (id)
);

CREATE TABLE sensor_node (
  id bigint not null,
  gateway_id bigint,
  serial_number VARCHAR(100) UNIQUE,
  longitude numeric(10, 6),
  latitude numeric(10, 6),
  battery_level numeric(5, 2),
  sensor_status VARCHAR(255) check (sensor_status in ('ONLINE','OFFLINE','UNKNOWN')),

  primary key (id)
);

CREATE TABLE sensor_reading (
  id bigint not null,
  node_id bigint,
  reading_timestamp timestamp(6) with time zone,
  soil_moisture FLOAT,
  soil_temperature FLOAT,
  battery_level numeric(5, 2),
  
  primary key (id)
);

alter table if exists farmra_user
    add constraint FK_user_user_role_role_id
    foreign key (role_id)
    references user_role(role_id);

alter table if exists sensor_node
    add constraint FK_sensor_node_gateway_gateway_id
    foreign key (gateway_id)
    references gateway(id);

alter table if exists sensor_reading
    add constraint FK_sensor_reading_sensor_node_sensor_node_id
    foreign key (node_id)
    references sensor_node(id);
