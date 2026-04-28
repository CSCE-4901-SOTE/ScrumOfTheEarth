package com.sote.FarmRa.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/readings")
public class ReadingsHistoryController {

    private final JdbcTemplate jdbcTemplate;

    public ReadingsHistoryController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/history/{nodeId}")
    public List<Map<String, Object>> getHistory(
            @PathVariable String nodeId,
            @RequestParam(defaultValue = "hourly") String interval) {

        String trunc;
        String range;

        switch (interval) {
            case "daily":
                trunc = "day";
                range = "30 days";
                break;
            case "weekly":
                trunc = "week";
                range = "12 weeks";
                break;
            case "monthly":
                trunc = "month";
                range = "12 months";
                break;
            default:
                trunc = "hour";
                range = "24 hours";
                break;
        }

        String sql = String.format("""
            SELECT
                date_trunc('%s', created_at)      AS bucket,
                AVG(temperature)                  AS avg_temperature,
                AVG(moisture)                     AS avg_moisture,
                AVG(CAST(light AS FLOAT))          AS avg_light
            FROM public.sensor_readings_test
            WHERE node_id = ?
              AND created_at >= NOW() - INTERVAL '%s'
            GROUP BY bucket
            ORDER BY bucket ASC
            """, trunc, range);

        return jdbcTemplate.queryForList(sql, nodeId);
    }
}
