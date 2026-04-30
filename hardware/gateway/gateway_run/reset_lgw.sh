#!/bin/bash

python3 << 'PYEOF'
import gpiod
import time

RESET_GPIO = 17

try:
    with gpiod.request_lines(
        '/dev/gpiochip4',
        consumer='reset_lgw',
        config={
            (RESET_GPIO,): gpiod.LineSettings(direction=gpiod.line.Direction.OUTPUT)
        }
    ) as request:
        request.set_value(RESET_GPIO, gpiod.line.Value.INACTIVE)
        time.sleep(0.1)
        request.set_value(RESET_GPIO, gpiod.line.Value.ACTIVE)
        time.sleep(0.1)
        request.set_value(RESET_GPIO, gpiod.line.Value.INACTIVE)
        time.sleep(0.1)
        print("[INFO] Reset sequence completed.")
except OSError as e:
    print(f"[WARN] GPIO error: {e}")

PYEOF
