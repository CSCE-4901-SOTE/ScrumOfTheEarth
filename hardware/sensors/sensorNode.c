#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <stdint.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "esp_timer.h"
#include "driver/gpio.h"
#include "driver/adc.h"
#include "esp_adc_cal.h"
#include "driver/i2c.h"

static const char *TAG = "sensor_demo";

// GPIO Pins
#define TEMP_SENSOR_PIN ADC1_CHANNEL_0   // GPIO36 - Temperature sensor analog input
#define LIGHT_SENSOR_PIN ADC1_CHANNEL_3  // GPIO39 - Light sensor analog input
#define MOISTURE_SENSOR_PIN ADC1_CHANNEL_6 // GPIO34 - Moisture sensor analog input

// I2C Configuration
#define I2C_MASTER_SCL_IO 22              // GPIO22 - I2C Clock
#define I2C_MASTER_SDA_IO 21              // GPIO21 - I2C Data
#define I2C_MASTER_NUM I2C_NUM_0          // I2C port number for master dev
#define I2C_MASTER_TX_BUF_DISABLE 0       // I2C master do not need buffer
#define I2C_MASTER_RX_BUF_DISABLE 0       // I2C master do not need buffer
#define I2C_MASTER_FREQ_HZ 100000         // I2C master clock frequency

// ADC Configuration
#define ADC_ATTEN ADC_ATTEN_DB_11         // ADC attenuation
#define ADC_WIDTH ADC_WIDTH_BIT_12        // ADC resolution (12-bit)


typedef struct {
    float current_temp;
    float raw_adc_value;
    int64_t last_update_us;
    esp_adc_cal_characteristics_t *adc_chars;
} SoilTemperatureSensor;


typedef struct {
    float brightness;           // 0.0 to 100.0%
    float raw_adc_value;
    int64_t last_update_us;
    esp_adc_cal_characteristics_t *adc_chars;
} LightSensor;

typedef struct {
    float current_moisture;     // 0.0 to 100.0%
    float raw_adc_value;
    int64_t last_update_us;
    esp_adc_cal_characteristics_t *adc_chars;
} SoilMoistureSensor;

static void adc_init(void) {
    // Configure ADC1
    adc1_config_width(ADC_WIDTH);
    
    // Configure ADC channels
    adc1_config_channel_atten(TEMP_SENSOR_PIN, ADC_ATTEN);
    adc1_config_channel_atten(LIGHT_SENSOR_PIN, ADC_ATTEN);
    adc1_config_channel_atten(MOISTURE_SENSOR_PIN, ADC_ATTEN);
    
    // Characterize ADC (voltage calibration)
    esp_adc_cal_characteristics_t *adc_chars = malloc(sizeof(esp_adc_cal_characteristics_t));
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN, ADC_WIDTH, 1100, adc_chars);
    
    ESP_LOGI(TAG, "ADC1 initialized with channels:");
    ESP_LOGI(TAG, "  - Temp Sensor:     GPIO36 (ADC1_CH0)");
    ESP_LOGI(TAG, "  - Light Sensor:    GPIO39 (ADC1_CH3)");
    ESP_LOGI(TAG, "  - Moisture Sensor: GPIO34 (ADC1_CH6)");
}

static esp_err_t i2c_master_init(void) {
    int i2c_master_port = I2C_MASTER_NUM;
    
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_MASTER_SDA_IO,
        .scl_io_num = I2C_MASTER_SCL_IO,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = I2C_MASTER_FREQ_HZ,
    };
    
    i2c_param_config(i2c_master_port, &conf);
    
    return i2c_driver_install(i2c_master_port, conf.mode, 
                             I2C_MASTER_RX_BUF_DISABLE, 
                             I2C_MASTER_TX_BUF_DISABLE, 0);
}

static float read_temperature_sensor(SoilTemperatureSensor *sensor) {
    // Read ADC raw value (0-4095 for 12-bit)
    uint32_t raw_adc = adc1_get_raw(TEMP_SENSOR_PIN);
    
    // Convert to voltage (mV)
    uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(raw_adc, sensor->adc_chars);
    
    // Convert voltage to temperature (simplified linear mapping)
    // Assumes: 0V = -10°C, 3.3V = 40°C
    float temp_celsius = -10.0f + ((float)voltage_mv / 3300.0f) * 50.0f;
    
    // Clamp to realistic range
    if (temp_celsius < -10.0f) temp_celsius = -10.0f;
    if (temp_celsius > 50.0f) temp_celsius = 50.0f;
    
    sensor->raw_adc_value = (float)raw_adc;
    sensor->current_temp = temp_celsius;
    sensor->last_update_us = esp_timer_get_time();
    
    return temp_celsius;
}


static float read_light_sensor(LightSensor *sensor) {
    // Read ADC raw value
    uint32_t raw_adc = adc1_get_raw(LIGHT_SENSOR_PIN);
    
    // Convert to voltage (mV)
    uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(raw_adc, sensor->adc_chars);
    
    // Convert voltage to brightness percentage (0-100%)
    float brightness = ((float)voltage_mv / 3300.0f) * 100.0f;
    
    // Clamp to 0-100%
    if (brightness < 0.0f) brightness = 0.0f;
    if (brightness > 100.0f) brightness = 100.0f;
    
    sensor->raw_adc_value = (float)raw_adc;
    sensor->brightness = brightness;
    sensor->last_update_us = esp_timer_get_time();
    
    return brightness;
}


static float read_moisture_sensor(SoilMoistureSensor *sensor) {
    // Read ADC raw value
    uint32_t raw_adc = adc1_get_raw(MOISTURE_SENSOR_PIN);
    
    // Convert to voltage (mV)
    uint32_t voltage_mv = esp_adc_cal_raw_to_voltage(raw_adc, sensor->adc_chars);
    
    // Convert voltage to moisture percentage
    // Assumes: 0V = 0% (dry), 3.3V = 100% (wet)
    float moisture = ((float)voltage_mv / 3300.0f) * 100.0f;
    
    // Clamp to 0-100%
    if (moisture < 0.0f) moisture = 0.0f;
    if (moisture > 100.0f) moisture = 100.0f;
    
    sensor->raw_adc_value = (float)raw_adc;
    sensor->current_moisture = moisture;
    sensor->last_update_us = esp_timer_get_time();
    
    return moisture;
}


void app_main(void)
{
    ESP_LOGI(TAG, "====================================");
    ESP_LOGI(TAG, "DUAL SENSOR SYSTEM - ESP32");
    ESP_LOGI(TAG, "Soil Temperature + Light Sensor");
    ESP_LOGI(TAG, "====================================\n");

    
    ESP_LOGI(TAG, "Initializing ADC subsystem...");
    adc_init();
    
    ESP_LOGI(TAG, "Initializing I2C master bus...");
    i2c_master_init();
    ESP_LOGI(TAG, "  - SCL: GPIO22 @ 100kHz");
    ESP_LOGI(TAG, "  - SDA: GPIO21\n");


    // Create ADC characteristics for all sensors
    esp_adc_cal_characteristics_t adc_chars;
    esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN, ADC_WIDTH, 1100, &adc_chars);

    // Initialize temperature sensor
    SoilTemperatureSensor temp_sensor = {
        .current_temp = 0.0f,
        .raw_adc_value = 0.0f,
        .last_update_us = esp_timer_get_time(),
        .adc_chars = &adc_chars
    };

    // Initialize light sensor
    LightSensor light_sensor = {
        .brightness = 0.0f,
        .raw_adc_value = 0.0f,
        .last_update_us = esp_timer_get_time(),
        .adc_chars = &adc_chars
    };

    // Initialize moisture sensor
    SoilMoistureSensor moisture_sensor = {
        .current_moisture = 0.0f,
        .raw_adc_value = 0.0f,
        .last_update_us = esp_timer_get_time(),
        .adc_chars = &adc_chars
    };

    ESP_LOGI(TAG, "Sensors initialized and ready for reading\n");

    // Take initial readings
    read_temperature_sensor(&temp_sensor);
    read_light_sensor(&light_sensor);
    read_moisture_sensor(&moisture_sensor);

    uint32_t reading_count = 0;


    while (1)
    {
        reading_count++;

        // Read all sensors
        float temp = read_temperature_sensor(&temp_sensor);
        float light = read_light_sensor(&light_sensor);
        float moisture = read_moisture_sensor(&moisture_sensor);

        // Determine light level description
        const char* light_status;
        if (light < 20.0f) {
            light_status = "NIGHT";
        } else if (light < 40.0f) {
            light_status = "DUSK";
        } else if (light < 60.0f) {
            light_status = "TWILIGHT";
        } else if (light < 80.0f) {
            light_status = "DAWN";
        } else {
            light_status = "BRIGHT";
        }

        // -------- DISPLAY READINGS --------
        ESP_LOGI(TAG, "[READING #%lu]", reading_count);
        ESP_LOGI(TAG, "  [TEMP]     Soil Temperature: %.2f°C (Raw ADC: %.0f)",
                 temp, temp_sensor.raw_adc_value);
        ESP_LOGI(TAG, "  [LIGHT]    Light Level: %.1f%% [%s] (Raw ADC: %.0f)",
                 light, light_status, light_sensor.raw_adc_value);
        ESP_LOGI(TAG, "  [MOISTURE] Soil Moisture: %.1f%% (Raw ADC: %.0f)",
                 moisture, moisture_sensor.raw_adc_value);
        ESP_LOGI(TAG, "------------------------------\n");

        // Wait 2 seconds before next reading
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
