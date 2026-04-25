package com.sote.FarmRa.controller; 

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SensorLiveController {

    private final JdbcTemplate jdbcTemplate;

    public SensorLiveController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final String BASE_SQL = """
      SELECT DISTINCT ON (sn.id)
          sn.id                    AS node_id,
          sn.name                  AS node_name,
          sn.latitude              AS latitude,
          sn.longitude             AS longitude,
          sn.status                AS node_status,
          sn.customer_id           AS customer_id,
          sn.technician_id         AS technician_id,
          cust.full_name           AS customer_name,
          tech.full_name           AS technician_name,
          COALESCE(sr.temperature, 0) AS temperature,
          COALESCE(sr.moisture, 0)    AS moisture,
          COALESCE(sr.light, 0)       AS light,
          COALESCE(sr.bat_quarters * 25, 0) AS battery,
          sr.created_at            AS last_reading_at
      FROM public.sensor_node sn
      LEFT JOIN public.sensor_readings_test sr
          ON sr.node_id = sn.id
      LEFT JOIN public.users cust
          ON cust.user_id = sn.customer_id
      LEFT JOIN public.users tech
          ON tech.user_id = sn.technician_id
      %s
      ORDER BY sn.id, sr.created_at DESC NULLS LAST
      """;

    @GetMapping("/sensors/latest")
    public List<Map<String, Object>> getLatestSensors() {
        return jdbcTemplate.queryForList(String.format(BASE_SQL, ""));
    }

    @GetMapping("/sensors/latest/customer/{customerId}")
    public List<Map<String, Object>> getLatestSensorsByCustomer(@PathVariable UUID customerId) {
        String where = "WHERE sn.customer_id = ?";
        return jdbcTemplate.queryForList(String.format(BASE_SQL, where), customerId);
    }

    @GetMapping("/sensors/latest/technician/{technicianId}")
    public List<Map<String, Object>> getLatestSensorsByTechnician(@PathVariable UUID technicianId) {
        String where = "WHERE sn.technician_id = ?";
        return jdbcTemplate.queryForList(String.format(BASE_SQL, where), technicianId);
    }
}
