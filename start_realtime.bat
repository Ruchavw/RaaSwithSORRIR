@echo off
echo 🧪 Starting Real-Time Resilient IoT System...

start cmd /k python feed_metrics_simulator.py
start cmd /k python anomaly_watcher.py
npx tsx source\mock-model.ts
