import socket
import json
import base64
import struct
import requests
from datetime import datetime, timezone, timedelta

SUPABASE_URL = "https://ikcsbketypnthmkwmbrk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrY3Nia2V0eXBudGhta3dtYnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDQzNzksImV4cCI6MjA4NjQyMDM3OX0.21K4Yjy3eOc85rw3bP8bjeF2VJ6WnkQjAmu9mvXVf9Q"
LISTEN_PORT  = 1700
CENTRAL      = timezone(timedelta(hours=-6))

# Maps node_id byte value ? database string
NODE_MAP = {
    1: "S001",
    2: "S002",
    3: "S003",
    4: "S004",
}
# Set to "sensor_readings_test" for testing, "sensor_readings" for production
TABLE = "sensor_readings_test"

def decode_payload(raw):
    print(f"  Raw hex: {raw.hex()}")

    # Strip 5-byte RYLR890 header, then hex-decode our payload
    if len(raw) < 6:
        print("  [WARN] Payload too short")
        return None

    ascii_payload = raw[5:].decode('ascii', errors='ignore').strip()
    print(f"  ASCII payload: {ascii_payload}")

    try:
        payload = bytes.fromhex(ascii_payload)
    except ValueError:
        print(f"  [WARN] Failed to hex-decode: {ascii_payload}")
        return None

    # 9-byte payload:
    # [0]   node_id      uint8
    # [1-2] temperature  int16  big-endian, *10
    # [3-4] moisture     uint16 big-endian, *10
    # [5]   light_pct    uint8  0-100
    # [6]   light_dig    uint8  0=BRIGHT 1=DARK
    # [7]   bat_quarters uint8  1-4
    # [8]   bat_alert    uint8  0=OK 1=LOW
    if len(payload) < 9:
        print(f"  [WARN] Payload too short: {len(payload)} bytes (expected 9)")
        return None

    node_num     = payload[0]
    temp_x10     = struct.unpack('>h', payload[1:3])[0]
    moist_x10    = struct.unpack('>H', payload[3:5])[0]
    light_pct    = payload[5]
    light_digital = bool(payload[6])
    bat_quarters = payload[7]
    bat_alert    = bool(payload[8])

    node_id = NODE_MAP.get(node_num, f"UNKNOWN-{node_num}")

    return {
        "node_id":       node_id,
        "temperature":   round(temp_x10 / 10.0, 1),
        "moisture":      round(moist_x10 / 10.0, 1),
        "light":         int(light_pct),
        "light_digital": light_digital,
        "bat_quarters":  int(bat_quarters),
        "bat_alert":     bat_alert,
        "created_at":    datetime.now(CENTRAL).strftime("%Y-%m-%dT%H:%M:%S-06:00")
    }

def insert_to_supabase(reading):
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    headers = {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "return=representation"
    }
    r = requests.post(url, headers=headers, json=reading)
    if r.status_code in (200, 201):
        print(f"  [OK] Inserted to {TABLE}: {reading}")
    else:
        print(f"  [ERROR] {r.status_code} {r.text}")

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
sock.bind(('0.0.0.0', LISTEN_PORT))
print(f"Listening on UDP {LISTEN_PORT} ? table: {TABLE}")

while True:
    try:
        data, addr = sock.recvfrom(4096)
        if len(data) < 4:
            continue
        token      = data[1:3]
        identifier = data[3]

        if identifier == 0x00:  # PUSH_DATA
            ack = bytes([2]) + token + bytes([1])
            sock.sendto(ack, addr)
            try:
                pkt = json.loads(data[12:].decode('utf-8'))
                if 'rxpk' in pkt:
                    for rx in pkt['rxpk']:
                        print(f"\n[RX] RSSI:{rx['rssi']} SNR:{rx['lsnr']} SF:{rx['datr']}")
                        raw = base64.b64decode(rx['data'])
                        reading = decode_payload(raw)
                        if reading:
                            bat_str = f"Q{reading['bat_quarters']}"
                            if reading['bat_alert']:
                                bat_str += " LOW!"
                            print(f"  [{reading['node_id']}] "
                                  f"Temp:{reading['temperature']}F | "
                                  f"Moist:{reading['moisture']}% | "
                                  f"Light:{reading['light']}% | "
                                  f"Bat:{bat_str}")
                            insert_to_supabase(reading)
            except Exception as e:
                print(f"[ERROR] {e}")

        elif identifier == 0x02:  # PULL_DATA
            pull_ack = bytes([2]) + token + bytes([4])
            sock.sendto(pull_ack, addr)

    except KeyboardInterrupt:
        print("\nShutting down")
        break