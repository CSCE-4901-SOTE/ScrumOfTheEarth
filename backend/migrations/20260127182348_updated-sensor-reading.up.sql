-- Add up migration script here
alter table if exists sensor_reading
    add light_level float;