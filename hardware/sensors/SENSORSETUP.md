# ESP32 Sensor Node - Flash Instructions

## Prerequisites
- ESP-IDF v5.5.2 installed
- ESP32 board connected via USB
- Windows PowerShell or Command Prompt

## Files Needed
- `sensorCode.c` - Firmware code
- `CMakeLists.txt` - Build configuration
- `idf_component.yml` - Dependencies

All files should be in: `hardware/sensors/`


## Step 1: Build Firmware

```powershell
cd C:\Users\hda0044\Documents\ScrumOfTheEarth\hardware\sensors

idf.py fullclean
idf.py set-target esp32
idf.py build
```

Wait for "Build complete!" message.

## Step 2: Flash to ESP32

```powershell
idf.py flash monitor
```

Press and hold BOOT button on ESP32 if it doesn't flash automatically.

## Step 3: Verify

You should see:
```
========================================
  Smart Field Sensor Node — DEMO MODE  
  Node ID: 1
  Transmitting every 30 seconds        
========================================
LoRa configured: 904.3MHz SF7 BW125
Ready. Starting demo transmission loop...
```

Every 30 seconds you should see:
```
Temp:     72.50 F
Moisture: 45.3%
Light:    65.2% (BRIGHT)
Battery:  4/4 bars | Alert: NO
Transmission OK
```

## Troubleshooting

### ESP32 won't connect
- Check USB cable
- Try different USB port
- Run: `idf.py erase-flash` then retry

### LoRa module not responding
- Verify UART wiring (GPIO 4/5)
- Check GPIO 18 (NRST) connection
- Enable AT_PASSTHROUGH_MODE in code to debug

### Temperature sensor not found
- Add 4.7kΩ pull-up resistor to GPIO 25
- Check DS18B20 wiring (DATA, GND, VCC)
- Sensor is optional - firmware continues without it

---

**Done! Your sensor node is now transmitting LoRa packets every 30 seconds.**
