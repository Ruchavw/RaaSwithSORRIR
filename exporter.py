from prometheus_client import start_http_server, Gauge
import json
import time
import os

ANOMALY_FILE = "data/outputs/anomaly.json"
FSM_LOG_FILE = "data/outputs/fsm_log.json"

# Metrics
anomaly_gauge = Gauge("is_anomaly", "Current anomaly status (0 or 1)")
score_gauge = Gauge("anomaly_score", "Latest anomaly score")
recovery_gauge = Gauge("recovery_triggered", "Whether RIDE-C recovery is triggered (1/0)")
ride_c_state_gauge = Gauge("ride_c_state", "RIDE-C State (RECOVERING=1, NORMAL=0)")
ride_d_state_gauge = Gauge("ride_d_state", "RIDE-D State (RECOVERED=1, IDLE=0)")

def update_metrics():
    while True:
        try:
            if os.path.exists(ANOMALY_FILE):
                with open(ANOMALY_FILE) as f:
                    anomaly_data = json.load(f)
                    anomaly_gauge.set(int(anomaly_data.get("is_anomaly", 0)))
                    score_gauge.set(float(anomaly_data.get("anomaly_score", 0.0)))

            if os.path.exists(FSM_LOG_FILE):
                with open(FSM_LOG_FILE) as f:
                    fsm_data = json.load(f)
                    ride_c_state_gauge.set(1 if fsm_data.get("ride_c_state") == "RECOVERING" else 0)
                    ride_d_state_gauge.set(1 if fsm_data.get("ride_d_state") == "RECOVERED" else 0)
                    recovery_gauge.set(fsm_data.get("recovery_triggered", 0))

            print(f"📡 Updated metrics: is_anomaly={anomaly_gauge._value.get()}, ride_c={ride_c_state_gauge._value.get()}, ride_d={ride_d_state_gauge._value.get()}")
        except Exception as e:
            print("⚠️ Failed to update metrics:", e)
        
        time.sleep(5)

if __name__ == "__main__":
    print("📡 Starting Prometheus metrics exporter on port 8000...")
    start_http_server(8000)
    update_metrics()
