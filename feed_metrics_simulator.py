#!/usr/bin/env python3
"""
Simulates continuous edge metrics for all edge devices.
Writes data to data/inputs/edge_metrics.csv every 5 seconds.
"""

import pandas as pd
import time
import random
import os

# ✅ Create inputs directory if not exists
os.makedirs("data/inputs", exist_ok=True)
csv_path = "data/inputs/edge_metrics.csv"

# ✅ List of simulated devices
devices = [
    "cam-1", "cam-2", "cloud", "fog-0",
    "irrigation-controller", "soil-sensor-node", "signal-monitor"
]

# ✅ Generate one row of metrics per device
def generate_row(device, timestamp):
    return {
        "device": device,
        "time": timestamp,
        "vmCount": random.randint(1, 5),
        "ramUsed": round(random.uniform(0.5, 2.0), 2),
        "ramTotal": 2.0,
        "ramUtilPercent": round(random.uniform(20, 95), 2),
        "cpuUtilPercent": round(random.uniform(10, 95), 2),
        "energyConsumed": round(random.uniform(0.5, 3.0), 2)
    }

# ✅ Initialize DataFrame
df = pd.DataFrame()

print("🚀 Starting metric simulation every 5 seconds...")

# 🔁 Feed metrics 500 times (or until manually stopped)
for t in range(1, 501):
    timestamp = int(time.time())
    batch = [generate_row(d, timestamp) for d in devices]
    df = pd.concat([df, pd.DataFrame(batch)], ignore_index=True)

    # 💾 Overwrite CSV with updated metrics
    df.to_csv(csv_path, index=False)

    print(f"✅ Appended metrics at time {timestamp} — rows: {len(df)}")

    # ⏳ Wait before next batch
    time.sleep(5)

print("🛑 Simulation complete.")
