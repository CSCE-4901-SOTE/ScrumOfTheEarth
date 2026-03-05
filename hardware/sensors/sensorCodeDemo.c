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
#include "mbedtls/aes.h"
#include <inttypes.h>

#define AT_PASSTHROUGH_MODE 0  // Set to 0 to run normal sensor code

static const char *TAG = "lorawan_sensor";

static uart_port_t lora_uart_port = UART_NUM_2;

// -------------------- PIN DEFINITIONS --------------------
#define MOISTURE_SENSOR_PIN ADC_CHANNEL_5 //GPIO33
#define LIGHT_SENSOR_GPIO   27
#define LORA_UART_TX_GPIO   4
#define LORA_UART_RX_GPIO   5
#define LORA_NRST_GPIO      18
#define LORA_UART_BAUD      115200
#define LORA_TX_BUF_SIZE    1024
#define LORA_RX_BUF_SIZE    1024
#define TEMP_SENSOR_GPIO    25

#define LORA_FREQUENCY      904300000
#define LORA_NETWORK_ID     0

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
}

static void temp_sensor_init(void) {
    onewire_bus_config_t bus_cfg = {
        .bus_gpio_num = TEMP_SENSOR_GPIO,
        .flags = {.en_pull_up = 1},
    };
    onewire_bus_rmt_config_t rmt_cfg = { .max_rx_bytes = 10 };
    if (onewire_new_bus_rmt(&bus_cfg, &rmt_cfg, &owb_handle) != ESP_OK) return;
    onewire_device_iter_handle_t iter = NULL;
    if (onewire_new_device_iter(owb_handle, &iter) != ESP_OK) return;
    onewire_device_t dev;
    while (onewire_device_iter_get_next(iter, &dev) == ESP_OK) {
        ds18b20_config_t cfg = {};
        if (ds18b20_new_device_from_enumeration(&dev, &cfg, &ds18b20_handle) == ESP_OK) break;
    }
    onewire_del_device_iter(iter);
}

static float read_temperature(void) {
    if (!ds18b20_handle) return -99.0f;
    float temp = -99.0f;
    if (ds18b20_trigger_temperature_conversion(ds18b20_handle) == ESP_OK) {
        vTaskDelay(pdMS_TO_TICKS(750));
        ds18b20_get_temperature(ds18b20_handle, &temp);
    }
    return temp;
}

// -------------------- LORA SEND --------------------
static void lora_send_at(const char *cmd) {
    ESP_LOGI(TAG, ">> %s", cmd);
    uart_write_bytes(lora_uart_port, cmd, strlen(cmd));
    uart_write_bytes(lora_uart_port, "\r\n", 2);
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
                    uart_write_bytes(lora_uart_port, cmd_buf, cmd_pos);
                    printf("\n");
                    cmd_pos = 0;
                }
            } else if (cmd_pos < (int)sizeof(cmd_buf) - 3) {
                cmd_buf[cmd_pos++] = buf[0];
            }
        }
    }

#else
    ESP_LOGI(TAG, "Starting raw LoRa soil sensor...");

    adc_init();
    gpio_set_direction(LIGHT_SENSOR_GPIO, GPIO_MODE_INPUT);
    gpio_pullup_en(LIGHT_SENSOR_GPIO);
    temp_sensor_init();

    lora_nrst_init();
    lora_uart_init();
    vTaskDelay(pdMS_TO_TICKS(500));

    if (!lora_init()) {
        ESP_LOGE(TAG, "LoRa init failed. Halting.");
        while (1) { vTaskDelay(pdMS_TO_TICKS(5000)); }
    }

    ESP_LOGI(TAG, "Ready. Starting transmission loop...");

    while (1) {
        // Read sensors
        int adc_raw = 0;
        adc_oneshot_read(adc_handle, MOISTURE_SENSOR_PIN, &adc_raw);
        int adc_clamped = adc_raw;
        if (adc_clamped > MOISTURE_DRY) adc_clamped = MOISTURE_DRY;
        if (adc_clamped < MOISTURE_WET) adc_clamped = MOISTURE_WET;
        float moisture_pct = ((float)(MOISTURE_DRY - adc_clamped) * 100.0f) / (MOISTURE_DRY - MOISTURE_WET);
        float temp_c = read_temperature();
        float temp_f = temp_c * 9.0f / 5.0f + 32.0f;
        bool is_dark = gpio_get_level(LIGHT_SENSOR_GPIO);

        ESP_LOGI(TAG, "Temp: %.2f F | Moisture: %.1f%% | Light: %s",
                 temp_f, moisture_pct, is_dark ? "DARK" : "BRIGHT");

        // Build simple 5 byte raw payload - no LoRaWAN, no encryption
        uint8_t payload[5];
        int16_t temp_x10   = (int16_t)(temp_f * 10);
        uint16_t moist_x10 = (uint16_t)(moisture_pct * 10);
        payload[0] = (temp_x10 >> 8) & 0xFF;
        payload[1] = temp_x10 & 0xFF;
        payload[2] = (moist_x10 >> 8) & 0xFF;
        payload[3] = moist_x10 & 0xFF;
        payload[4] = is_dark ? 0x01 : 0x00;

        char hex_payload[11];
        bytes_to_hex(payload, 5, hex_payload);

        char cmd[64];
        snprintf(cmd, sizeof(cmd), "AT+SEND=0,10,%s", hex_payload);
        ESP_LOGI(TAG, "Sending raw payload: %s", hex_payload);
        lora_send_at(cmd);

        char response[256];
        int len = lora_read_response(response, sizeof(response), 3000);
        if (len <= 0) ESP_LOGW(TAG, "No response to AT+SEND");

        vTaskDelay(pdMS_TO_TICKS(15000));
    }
#endif
}
