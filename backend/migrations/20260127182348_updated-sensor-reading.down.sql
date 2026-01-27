-- Add down migration script here
alter table if exists sensor_reading
    DROP COLUMN light_level;