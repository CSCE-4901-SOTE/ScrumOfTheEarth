package com.sote.FarmRa.controller;

import com.sote.FarmRa.model.dto.AlertDTO;
import com.sote.FarmRa.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public List<AlertDTO> getAlerts() {
        return alertService.getAlerts();
    }

    @PutMapping("/{id}/acknowledge")
    public void acknowledge(@PathVariable UUID id) {
        alertService.acknowledge(id);
    }
}
