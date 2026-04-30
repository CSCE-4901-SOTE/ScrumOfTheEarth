# FARMRA Gateway — Setup README

**Hardware:** Raspberry Pi 5 + RAK2287 LoRa Concentrator (SX1302)

---

## Files in This Package

| File | Destination on Pi | Purpose |
|---|---|---|
| `lora_supabase_bridge.py` | `/home/pi/` | Decodes LoRa packets and inserts to Supabase |
| `lora-bridge.service` | `/etc/systemd/system/` | systemd service for the bridge |
| `lora-pktfwd.service` | `/etc/systemd/system/` | systemd service for the packet forwarder |

The packet forwarder binary (`lora_pkt_fwd`), reset script (`reset_lgw.sh`), and RF config (`global_conf.json`) are **not included here** — these come from the RAK2287 SDK and must already be present at `/home/pi/gateway_run/`.

---

## Prerequisites

- Raspberry Pi OS Lite (64-bit) installed and booted
- RAK2287 HAT seated on the Pi's GPIO header
- SPI enabled (`sudo raspi-config` → Interface Options → SPI → Enable)
- Ethernet connected (do not rely on WiFi)
- Python 3 and pip installed
- `requests` library: `sudo pip3 install requests --break-system-packages`

---

## Step 1 — Copy Files to the Pi

From your local machine (replace `YOUR_PI_IP`):

```bash
scp lora_supabase_bridge.py pi@YOUR_PI_IP:/home/pi/
scp lora-bridge.service pi@YOUR_PI_IP:/tmp/
scp lora-pktfwd.service pi@YOUR_PI_IP:/tmp/
```

Then SSH into the Pi and move the service files into place:

```bash
sudo mv /tmp/lora-bridge.service /etc/systemd/system/
sudo mv /tmp/lora-pktfwd.service /etc/systemd/system/
```

---

## Step 2 — Create the Logs Directory

```bash
mkdir -p /home/pi/logs
```

---

## Step 3 — Configure the Bridge Script

Open `/home/pi/lora_supabase_bridge.py` and verify the following at the top of the file:

```python
TABLE = "sensor_readings_test"   # Change to "sensor_readings" for production
```

Leave `SUPABASE_URL` and `SUPABASE_KEY` as-is unless the Supabase project changes.

---

## Step 4 — Verify global_conf.json

The packet forwarder config must have this set correctly or **all packets will be silently dropped:**

```json
"lorawan_public": false
```

Confirm it:

```bash
grep lorawan_public /home/pi/gateway_run/global_conf.json
```

Expected output: `"lorawan_public": false`

---

## Step 5 — Enable and Start Services

```bash
sudo systemctl daemon-reload
sudo systemctl enable lora-bridge.service
sudo systemctl enable lora-pktfwd.service
sudo systemctl start lora-bridge.service
sleep 12
sudo systemctl start lora-pktfwd.service
```

> **Why the 12 second wait?** The bridge must bind UDP port 1700 before the packet forwarder starts. The `lora-pktfwd.service` file already includes a 10-second `ExecStartPre` sleep, but waiting manually here ensures it when starting by hand.

---

## Step 6 — Verify Everything is Running

Check service status:

```bash
sudo systemctl status lora-bridge.service lora-pktfwd.service
```

Both should show `active (running)`.

Check that the bridge owns port 1700:

```bash
sudo ss -ulnp | grep 1700
```

Expected output:
```
UNCONN  0  0  0.0.0.0:1700  *  users:(("python3",...))
```

Watch live bridge output:

```bash
tail -f /home/pi/logs/bridge.log
```

When a sensor node transmits, you should see:

```
[RX] RSSI:-52 SNR:10.2 SF:SF12BW125
  [S004] Temp:72.2F | Moist:18.5% | Light:63% | Bat:Q4
  [OK] Inserted to sensor_readings_test: {...}
```

---

## Node ID Mapping

The bridge maps the `node_id` byte in the payload to a database string:

```python
NODE_MAP = {
    1: "S001",
    2: "S002",
    3: "S003",
    4: "S004",
}
```

If you add more nodes, update this dictionary in `lora_supabase_bridge.py` and restart the bridge service:

```bash
sudo systemctl restart lora-bridge.service
```

---

## Switching to Production

When you are ready to write to the live production table, change line in `lora_supabase_bridge.py`:

```python
TABLE = "sensor_readings"   # was "sensor_readings_test"
```

Then restart:

```bash
sudo systemctl restart lora-bridge.service
```

---

## Daily Shutdown — Important

Always shut the Pi down gracefully before unplugging. Unplugging without shutdown causes port 1700 conflicts on the next boot.

```bash
sudo shutdown now
```

Wait for the green activity LED to stop blinking before removing power.

---

## Troubleshooting

**Bridge log is empty**
The `-u` flag on python3 is required in the service file for unbuffered output. Confirm `ExecStart` reads:
`ExecStart=/usr/bin/python3 -u /home/pi/lora_supabase_bridge.py`

**Port 1700 conflict after unclean shutdown**
```bash
sudo fuser -k 1700/udp
sudo systemctl restart lora-bridge.service
sleep 12
sudo systemctl restart lora-pktfwd.service
```

**Packets received but Supabase returns 400 error**
- `PGRST204` — column name mismatch. Check that column names in the `return` dict inside `decode_payload()` exactly match your Supabase table columns.
- `null value in column "id"` — the `id` column is missing its auto-increment default. Fix in Supabase SQL Editor:
  ```sql
  ALTER TABLE sensor_readings
    ALTER COLUMN id SET DEFAULT nextval('sensor_readings_id_seq');
  ```

**No packets received at all (RF packets received = 0)**
- Confirm `lorawan_public: false` in `global_conf.json`
- Confirm sensor node is powered on and transmitting (check ESP32 serial monitor)
- Confirm antenna is connected to the RAK2287

**Emergency full restart**
```bash
sudo systemctl stop lora-bridge.service lora-pktfwd.service
sudo pkill -9 -f lora_supabase_bridge.py
sudo pkill -9 -f lora_pkt_fwd
sleep 5
sudo fuser -k 1700/udp
sleep 3
sudo python3 ~/lora_supabase_bridge.py &
sleep 5
cd ~/gateway_run && sudo ./reset_lgw.sh && sudo ./lora_pkt_fwd -c global_conf.json
```
