CREATE TABLE user_role (
  id bigint not null,
  role_name VARCHAR(255) NOT NULL,

  primary key (id)
);

CREATE TABLE farmra_user (
  id bigint not null,
  user_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  role_id bigint,

  primary key (id)
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
    references user_role(id);

alter table if exists sensor_node
    add constraint FK_sensor_node_gateway_gateway_id
    foreign key (gateway_id)
    references gateway(id);

alter table if exists sensor_reading
    add constraint FK_sensor_reading_sensor_node_sensor_node_id
    foreign key (node_id)
    references sensor_node(id);