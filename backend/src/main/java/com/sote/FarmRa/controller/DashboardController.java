package com.sote.FarmRa.controller;

package com.sote.FarmRa.model.dto.DashboardDTO;
package com.sote.FarmRa.model.dto.SensorDTO;
import com.sote.FarmRa.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4000"})
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * For dashboard map + inventory table
     * GET /api/dashboard/sensors
     */
    @GetMapping("/sensors")
    public List<SensorDTO> getSensors(
            @RequestParam(name = "customerId", required = false) UUID customerId,
            @RequestParam(name = "technicianId", required = false) UUID technicianId
    ){
        if (customerId != null) {
            return dashboardService.getSensorsByCustomer(customerId);
        }

        if (technicianId != null) {
            return dashboardService.getSensorsByTechnician(technicianId);
        }

        return dashboardService.getSensors(); // fallback (admin/debug)
    }
    /**
     * For dashboard summary boxes
     * GET /api/dashboard/summary
     */
    @GetMapping("/summary")
    public DashboardDTO getSummary() {
        return dashboardService.getSummary();
    }
}
