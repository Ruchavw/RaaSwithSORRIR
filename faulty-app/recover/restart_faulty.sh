#!/bin/bash

# ✅ Ensure the directory exists before logging
mkdir -p ./data/outputs

# ✅ Append to the log
echo "[RaaS] Restarting faulty-app container..." | tee -a ./data/outputs/recovery_attempt.log

# ✅ Restart the container
docker restart faulty-app
