#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "driver/gpio.h"
#include "esp_adc/adc_oneshot.h"
#include "driver/uart.h"
#include "onewire_bus.h"
#include "ds18b20.h"
#include <inttypes.h>

#define AT_PASSTHROUGH_MODE 0  // Set to 1 to enter AT passthrough mode

static const char *TAG = "lorawan_sensor";

static uart_port_t lora_uart_port = UART_NUM_2;

// -------------------- PIN DEFINITIONS --------------------
#define MOISTURE_SENSOR_PIN ADC_CHANNEL_5   // GPIO33
#define LIGHT_ANALOG_PIN    ADC_CHANNEL_6   // GPIO34 - AO pin on LM393
#define LIGHT_DIGITAL_GPIO  27              // DO pin on LM393 (backup/threshold)
#define BATTERY_ADC_PIN     ADC_CHANNEL_0   // GPIO36 (VP) - voltage divider midpoint
#define LORA_UART_TX_GPIO   4
#define LORA_UART_RX_GPIO   5
#define LORA_NRST_GPIO      18
#define LORA_UART_BAUD      115200
#define LORA_TX_BUF_SIZE    1024
#define LORA_RX_BUF_SIZE    1024
#define TEMP_SENSOR_GPIO    25

#define LORA_FREQUENCY      904300000
#define LORA_NETWORK_ID     0

// -------------------- NODE ID --------------------
#define NODE_ID             1  // Change this for different sensor nodes (1-4)

// -------------------- DEMO SETTING --------------------
#define TRANSMISSION_INTERVAL_MS    30000   // 30 seconds for demo
                                            // Change to 3600000 for production (1 hour)

// Light sensor ADC range calibration
#define LIGHT_DARK_VAL      3800
#define LIGHT_BRIGHT_VAL     400

// -------------------- BATTERY CONFIGURATION --------------------
// Voltage divider: 2x 100kΩ resistors (1:1 ratio, so voltage is halved)
// Fresh AA batteries: ~3.0V (fresh) to 2.1V (dead)
#define BATTERY_FULL_MV     1900       // Fresh batteries at 3.0V (ADC reads 1.5V)
#define BATTERY_DEAD_MV     1000       // Dead batteries at 2.1V (ADC reads 1.05V)
#define BATTERY_ADC_SAMPLES    16
#define BATTERY_ALERT_QUARTER   1

// -------------------- SENSOR PAYLOAD --------------------
static uint32_t fcnt_up = 0;

#define ADC_ATTEN_VAL   ADC_ATTEN_DB_12
#define MOISTURE_DRY    2500
#define MOISTURE_WET    1400
static adc_oneshot_unit_handle_t adc_handle;

static onewire_bus_handle_t owb_handle = NULL;
static ds18b20_device_handle_t ds18b20_handle = NULL;

static void bytes_to_hex(const uint8_t *data, uint8_t len, char *hex_out) {
    for (uint8_t i = 0; i < len; i++) sprintf(hex_out + (i * 2), "%02X", data[i]);
    hex_out[len * 2] = '\0';
}

// -------------------- NRST --------------------
static void lora_nrst_init(void) {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << LORA_NRST_GPIO),
        .mode         = GPIO_MODE_OUTPUT,
        .pull_up_en   = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type    = GPIO_INTR_DISABLE,
    };
    gpio_config(&io_conf);
    ESP_LOGI(TAG, "NRST: resetting module...");
    gpio_set_level(LORA_NRST_GPIO, 0);
    vTaskDelay(pdMS_TO_TICKS(200));
    gpio_set_level(LORA_NRST_GPIO, 1);
    vTaskDelay(pdMS_TO_TICKS(1000));
    ESP_LOGI(TAG, "NRST: module ready");
}

// -------------------- UART --------------------
static void lora_uart_init(void) {
    uart_config_t uart_config = {
        .baud_rate  = LORA_UART_BAUD,
        .data_bits  = UART_DATA_8_BITS,
        .parity     = UART_PARITY_DISABLE,
        .stop_bits  = UART_STOP_BITS_1,
        .flow_ctrl  = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_DEFAULT,
    };
    ESP_ERROR_CHECK(uart_driver_install(lora_uart_port, LORA_RX_BUF_SIZE, LORA_TX_BUF_SIZE, 0, NULL, 0));
    ESP_ERROR_CHECK(uart_param_config(lora_uart_port, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(lora_uart_port, LORA_UART_TX_GPIO, LORA_UART_RX_GPIO,
                                  UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_LOGI(TAG, "LoRa UART initialized (TX=GPIO%d, RX=GPIO%d, BAUD=%d)",
             LORA_UART_TX_GPIO, LORA_UART_RX_GPIO, LORA_UART_BAUD);
}

// -------------------- SENSORS --------------------
static void adc_init(void) {
    adc_oneshot_unit_init_cfg_t init_config = {
        .unit_id  = ADC_UNIT_1,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };
    ESP_ERROR_CHECK(adc_oneshot_new_unit(&init_config, &adc_handle));

    adc_oneshot_chan_cfg_t config = {
        .atten    = ADC_ATTEN_VAL,
        .bitwidth = ADC_BITWIDTH_12,
    };
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc_handle, MOISTURE_SENSOR_PIN, &config));
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc_handle, LIGHT_ANALOG_PIN,    &config));
    ESP_ERROR_CHECK(adc_oneshot_config_channel(adc_handle, BATTERY_ADC_PIN,     &config));
}

static void temp_sensor_init(void) {
    ESP_LOGI(TAG, "Initializing DS18B20 temperature sensor on GPIO%d...", TEMP_SENSOR_GPIO);
    
    onewire_bus_config_t bus_cfg = {
        .bus_gpio_num = TEMP_SENSOR_GPIO,
        .flags = {.en_pull_up = 1},
    };
    onewire_bus_rmt_config_t rmt_cfg = { .max_rx_bytes = 10 };
    
    esp_err_t err = onewire_new_bus_rmt(&bus_cfg, &rmt_cfg, &owb_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create 1-Wire bus: %s", esp_err_to_name(err));
        ESP_LOGW(TAG, "Continuing without temperature sensor...");
        return;
    }
    
    onewire_device_iter_handle_t iter = NULL;
    err = onewire_new_device_iter(owb_handle, &iter);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create device iterator: %s", esp_err_to_name(err));
        return;
    }
    
    onewire_device_t dev;
    int device_count = 0;
    while (onewire_device_iter_get_next(iter, &dev) == ESP_OK) {
        device_count++;
        ESP_LOGI(TAG, "Found 1-Wire device #%d", device_count);
        ds18b20_config_t cfg = {};
        err = ds18b20_new_device_from_enumeration(&dev, &cfg, &ds18b20_handle);
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "DS18B20 initialized successfully!");
            break;
        } else {
            ESP_LOGE(TAG, "Failed to initialize DS18B20: %s", esp_err_to_name(err));
        }
    }
    
    if (device_count == 0) {
        ESP_LOGW(TAG, "No 1-Wire devices found on GPIO%d!", TEMP_SENSOR_GPIO);
        ESP_LOGW(TAG, "Check wiring: DATA line should have 4.7kΩ pull-up to 3.3V");
    }
    
    onewire_del_device_iter(iter);
}

static float read_temperature(void) {
    if (!ds18b20_handle) {
        ESP_LOGW(TAG, "Temperature sensor not initialized, returning -99.0");
        return -99.0f;
    }
    
    float temp = -99.0f;
    esp_err_t err = ds18b20_trigger_temperature_conversion(ds18b20_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to trigger temperature conversion: %s", esp_err_to_name(err));
        return -99.0f;
    }
    
    vTaskDelay(pdMS_TO_TICKS(750));
    
    err = ds18b20_get_temperature(ds18b20_handle, &temp);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read temperature: %s", esp_err_to_name(err));
        return -99.0f;
    }
    
    ESP_LOGI(TAG, "Temperature read: %.2f°C", temp);
    return temp;
}

static float read_light_percent(void) {
    int adc_raw = 0;
    adc_oneshot_read(adc_handle, LIGHT_ANALOG_PIN, &adc_raw);
    ESP_LOGI(TAG, "Light ADC raw: %d", adc_raw);
    if (adc_raw > LIGHT_DARK_VAL)   adc_raw = LIGHT_DARK_VAL;
    if (adc_raw < LIGHT_BRIGHT_VAL) adc_raw = LIGHT_BRIGHT_VAL;
    float pct = ((float)(LIGHT_DARK_VAL - adc_raw) * 100.0f) / (LIGHT_DARK_VAL - LIGHT_BRIGHT_VAL);
    return pct;
}

// -------------------- BATTERY READING --------------------
static uint8_t read_battery_quarters(uint8_t *alert_out) {
    int32_t sum = 0;
    int raw = 0;
    for (int i = 0; i < BATTERY_ADC_SAMPLES; i++) {
        adc_oneshot_read(adc_handle, BATTERY_ADC_PIN, &raw);
        sum += raw;
    }
    int adc_avg = (int)(sum / BATTERY_ADC_SAMPLES);
    
    // Calculate voltage: (ADC_avg / 4095) * 3.3V (full scale of ADC_ATTEN_DB_12)
    // Then multiply by 2 because voltage divider halves the input voltage
    int adc_mv  = ((adc_avg * 3300) / 4095) * 2;

    // DIAGNOSTIC: Log raw values
    ESP_LOGI(TAG, "Battery DEBUG: raw_adc_avg=%d adc_mv=%dmV (divider corrected)", adc_avg, adc_mv);

    if (adc_mv > BATTERY_FULL_MV) adc_mv = BATTERY_FULL_MV;
    if (adc_mv < BATTERY_DEAD_MV) adc_mv = BATTERY_DEAD_MV;

    int percent = ((adc_mv - BATTERY_DEAD_MV) * 100) / (BATTERY_FULL_MV - BATTERY_DEAD_MV);

    uint8_t quarters;
    if      (percent >= 75) quarters = 4;
    else if (percent >= 50) quarters = 3;
    else if (percent >= 25) quarters = 2;
    else                    quarters = 1;

    *alert_out = (quarters <= BATTERY_ALERT_QUARTER) ? 1 : 0;

    ESP_LOGI(TAG, "Battery: raw=%d adc_mv=%dmV percent=%d%% quarters=%u/4 alert=%u",
             adc_avg, adc_mv, percent, quarters, *alert_out);

    return quarters;
}

// -------------------- LORA --------------------
static void lora_send_at(const char *cmd) {
    ESP_LOGI(TAG, ">> %s", cmd);
    uart_write_bytes(lora_uart_port, (const uint8_t *)cmd, strlen(cmd));
    uart_write_bytes(lora_uart_port, (const uint8_t *)"\r\n", 2);
}

static int lora_read_response(char *buf, size_t size, int timeout_ms) {
    int len = uart_read_bytes(lora_uart_port, (uint8_t *)buf, size - 1, pdMS_TO_TICKS(timeout_ms));
    if (len > 0) {
        buf[len] = '\0';
        ESP_LOGI(TAG, "<< %s", buf);
    }
    return len;
}

static bool lora_init(void) {
    char response[256];
    uart_flush(lora_uart_port);

    lora_send_at("AT");
    int rlen = lora_read_response(response, sizeof(response), 2000);
    if (rlen <= 0 || strstr(response, "OK") == NULL) {
        ESP_LOGE(TAG, "Module not responding!");
        return false;
    }
    ESP_LOGI(TAG, "Module responding OK!");

    lora_send_at("AT+BAND=904300000");
    lora_read_response(response, sizeof(response), 2000);
    lora_send_at("AT+PARAMETER=7,7,1,4");
    lora_read_response(response, sizeof(response), 2000);
    lora_send_at("AT+NETWORKID=0");
    lora_read_response(response, sizeof(response), 2000);
    lora_send_at("AT+ADDRESS=0");
    lora_read_response(response, sizeof(response), 2000);

    ESP_LOGI(TAG, "LoRa configured: 904.3MHz SF7 BW125");
    return true;
}

// -------------------- MAIN --------------------
void app_main(void) {
#if AT_PASSTHROUGH_MODE
    lora_nrst_init();
    lora_uart_init();
    vTaskDelay(pdMS_TO_TICKS(500));

    ESP_LOGI("PASSTHROUGH", "AT passthrough ready. Type commands, press Enter to send.");

    static char cmd_buf[256];
    static int cmd_pos = 0;
    uint8_t buf[512];

    while (1) {
        int lora_len = uart_read_bytes(lora_uart_port, buf, sizeof(buf) - 1, pdMS_TO_TICKS(20));
        if (lora_len > 0) {
            buf[lora_len] = '\0';
            printf("LORA>> %s\n", (char *)buf);
            fflush(stdout);
        }
        int usb_len = fread(buf, 1, 1, stdin);
        if (usb_len > 0) {
            fwrite(buf, 1, 1, stdout);
            fflush(stdout);
            if (buf[0] == '\r' || buf[0] == '\n') {
                if (cmd_pos > 0) {
                    cmd_buf[cmd_pos++] = '\r';
                    cmd_buf[cmd_pos++] = '\n';
                    uart_write_bytes(lora_uart_port, (const uint8_t *)cmd_buf, cmd_pos);
                    printf("\n");
                    cmd_pos = 0;
                }
            } else if (cmd_pos < (int)sizeof(cmd_buf) - 3) {
                cmd_buf[cmd_pos++] = buf[0];
            }
        }
    }

#else
    ESP_LOGI(TAG, "========================================");
    ESP_LOGI(TAG, "  Smart Field Sensor Node — DEMO MODE  ");
    ESP_LOGI(TAG, "  Node ID: %u", NODE_ID);
    ESP_LOGI(TAG, "  Transmitting every 30 seconds        ");
    ESP_LOGI(TAG, "========================================");

    adc_init();
    gpio_set_direction(LIGHT_DIGITAL_GPIO, GPIO_MODE_INPUT);
    gpio_pullup_en(LIGHT_DIGITAL_GPIO);
    temp_sensor_init();

    lora_nrst_init();
    lora_uart_init();
    vTaskDelay(pdMS_TO_TICKS(500));

    if (!lora_init()) {
        ESP_LOGE(TAG, "LoRa init failed. Halting.");
        while (1) { vTaskDelay(pdMS_TO_TICKS(5000)); }
    }

    ESP_LOGI(TAG, "Ready. Starting demo transmission loop...");

    uint32_t tx_count = 0;

    while (1) {
        tx_count++;
        ESP_LOGI(TAG, "-------- Transmission #%lu --------", tx_count);

        // ── Moisture ──
        int adc_raw = 0;
        adc_oneshot_read(adc_handle, MOISTURE_SENSOR_PIN, &adc_raw);
        int adc_clamped = adc_raw;
        if (adc_clamped > MOISTURE_DRY) adc_clamped = MOISTURE_DRY;
        if (adc_clamped < MOISTURE_WET) adc_clamped = MOISTURE_WET;
        float moisture_pct = ((float)(MOISTURE_DRY - adc_clamped) * 100.0f) / (MOISTURE_DRY - MOISTURE_WET);

        // ── Temperature ──
        float temp_c = read_temperature();
        float temp_f = temp_c * 9.0f / 5.0f + 32.0f;

        // ── Light ──
        float light_pct = read_light_percent();
        bool is_dark_digital = gpio_get_level(LIGHT_DIGITAL_GPIO);

        // ── Battery ──
        uint8_t bat_alert    = 0;
        uint8_t bat_quarters = read_battery_quarters(&bat_alert);

        ESP_LOGI(TAG, "Temp:     %.2f F", temp_f);
        ESP_LOGI(TAG, "Moisture: %.1f%%", moisture_pct);
        ESP_LOGI(TAG, "Light:    %.1f%% (%s)", light_pct, is_dark_digital ? "DARK" : "BRIGHT");
        ESP_LOGI(TAG, "Battery:  %u/4 bars | Alert: %s", bat_quarters, bat_alert ? "YES" : "NO");

        // ── Build 9-byte payload ──
        uint8_t payload[9];
        int16_t  temp_x10   = (int16_t)(temp_f * 10);
        uint16_t moist_x10  = (uint16_t)(moisture_pct * 10);
        uint8_t  light_byte = (uint8_t)(light_pct + 0.5f);
        if (light_byte > 100) light_byte = 100;

        payload[0] = NODE_ID;                          // Node ID
        payload[1] = (temp_x10  >> 8) & 0xFF;          // Temp high byte
        payload[2] =  temp_x10        & 0xFF;          // Temp low byte
        payload[3] = (moist_x10 >> 8) & 0xFF;          // Moisture high byte
        payload[4] =  moist_x10       & 0xFF;          // Moisture low byte
        payload[5] =  light_byte;                      // Light percentage
        payload[6] =  is_dark_digital ? 0x01 : 0x00;   // Digital light threshold
        payload[7] =  bat_quarters;                    // Battery quarters
        payload[8] =  bat_alert;                       // Battery alert flag

        char hex_payload[19];  // 9 bytes * 2 hex chars + null terminator
        bytes_to_hex(payload, 9, hex_payload);

        char cmd[64];
        snprintf(cmd, sizeof(cmd), "AT+SEND=0,18,%s", hex_payload);
        ESP_LOGI(TAG, "Payload (9 bytes): %s", hex_payload);
        lora_send_at(cmd);

        char response[256];
        int len = lora_read_response(response, sizeof(response), 3000);
        if (len <= 0) {
            ESP_LOGW(TAG, "No response to AT+SEND");
        } else {
            ESP_LOGI(TAG, "Transmission OK");
        }

        ESP_LOGI(TAG, "Next transmission in %d seconds...", TRANSMISSION_INTERVAL_MS / 1000);
        vTaskDelay(pdMS_TO_TICKS(TRANSMISSION_INTERVAL_MS));
    }
#endif
}
