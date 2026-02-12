package com.sote.FarmRa.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.repository.SensorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SensorService {

  private final SensorRepository sensorRepository;

  // ✅ READ ALL
  public List<Sensor> getSensors() {
    return sensorRepository.findAll();
  }

  // ✅ READ ONE
  public Sensor getById(String id) {
    if (id == null || id.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensor id is required");
    }

    return sensorRepository.findById(id)
        .orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensor not found: " + id)
        );
  }

  // ✅ CREATE
  public Sensor create(Sensor sensor) {
    if (sensor == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensor body is required");
    }

    // NOTE: we are NOT calling sensor.getId() here so it won't break if your entity uses a different field name
    return sensorRepository.save(sensor);
  }

  // ✅ DELETE
  public void delete(String id) {
    if (id == null || id.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensor id is required");
    }

    if (!sensorRepository.existsById(id)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensor not found: " + id);
    }

    sensorRepository.deleteById(id);
  }
}
