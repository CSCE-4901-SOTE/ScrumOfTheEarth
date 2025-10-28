alter table if exists farmra_user
    drop constraint if exists FK_user_user_role_role_id;

alter table if exists sensor_node
    drop constraint if exists FK_sensor_node_gateway_gateway_id;

alter table if exists sensor_reading
    drop constraint if exists FK_sensor_reading_sensor_node_sensor_node_id;

drop table if exists farmra_user cascade;

drop table if exists user_role cascade;

drop table if exists gateway cascade;

drop table if exists sensor_node cascade;

drop table if exists sensor_reading cascade;