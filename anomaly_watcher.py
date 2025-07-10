#!/usr/bin/env python3
"""
Real-Time Anomaly Detection Watcher
Continuously monitors edge_metrics.csv and writes live anomaly.json for RaaS
"""

import pandas as pd
import numpy as np
import json
import time
import os
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("RealTimeWatcher")

class RealTimeAnomalyWatcher:
    def __init__(
        self,
        input_file="data/inputs/edge_metrics.csv",
        output_file="data/outputs/anomaly.json",
        time_checkpoint="data/outputs/.last_time.json",
        check_interval=5
    ):
        self.input_file = input_file
        self.output_file = output_file
        self.time_checkpoint = time_checkpoint
        self.check_interval = check_interval
        self.last_processed_time = self.load_last_time()
        self.scaler = StandardScaler()
        self.isolation_forest = None
        self.is_trained = False

        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)

        logger.info(f"📁 Input: {self.input_file}")
        logger.info(f"📁 Output: {self.output_file}")
        logger.info(f"⏱️  Check interval: {self.check_interval} seconds")

    def load_last_time(self):
        if os.path.exists(self.time_checkpoint):
            try:
                with open(self.time_checkpoint, "r") as f:
                    return json.load(f).get("last_time", 0)
            except:
                return 0
        return 0

    def save_last_time(self, timestamp):
        with open(self.time_checkpoint, "w") as f:
            json.dump({"last_time": timestamp}, f)

    def load_new_data(self):
        if not os.path.exists(self.input_file):
            logger.warning("📂 Input file missing")
            return None

        try:
          df = pd.read_csv(self.input_file)
        except pd.errors.EmptyDataError:
          print("⚠️ anomaly.csv is empty, skipping...")
          return None  # or return an empty DataFrame
        new_data = df[df["time"] > self.last_processed_time].copy()

        if new_data.empty:
            return None

        self.last_processed_time = new_data["time"].max()
        self.save_last_time(int(self.last_processed_time))
        feature_cols = ["vmCount", "ramUsed", "ramTotal", "ramUtilPercent", "cpuUtilPercent", "energyConsumed"]
        available = [col for col in feature_cols if col in new_data.columns]
        features = new_data[available].fillna(0)

        return new_data, features

    def train_model(self, df):
        feature_cols = ["vmCount", "ramUsed", "ramTotal", "ramUtilPercent", "cpuUtilPercent", "energyConsumed"]
        features = df[feature_cols].fillna(0)
        self.scaler.fit(features)
        self.isolation_forest = IsolationForest(contamination=0.1, n_estimators=100, random_state=42)
        self.isolation_forest.fit(self.scaler.transform(features))
        self.is_trained = True
        logger.info(f"🌲 Model trained on {len(df)} records")

    def detect(self, new_data, features):
        if not self.is_trained:
            if len(features) >= 10:
                self.train_model(new_data)
            else:
                logger.warning("⚠️ Not enough data to train. Skipping.")
                return self.empty_result(new_data)

        scaled = self.scaler.transform(features)
        predictions = self.isolation_forest.predict(scaled)
        scores = self.isolation_forest.decision_function(scaled)

        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:
                score = scores[i]
                severity = self.severity(score)
                anomalies.append({
                    "device": new_data.iloc[i]["device"],
                    "time": int(new_data.iloc[i]["time"]),
                    "anomaly_score": float(score),
                    "cpu": float(new_data.iloc[i].get("cpuUtilPercent", 0)),
                    "ram": float(new_data.iloc[i].get("ramUtilPercent", 0)),
                    "severity": severity
                })

        return self.build_output(new_data, anomalies)

    def severity(self, score):
        if score <= -0.5:
            return "HIGH"
        elif score <= -0.2:
            return "MEDIUM"
        return "LOW"

    def build_output(self, data, anomalies):
        devices = {a["device"]: a["severity"] for a in anomalies}

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "processed_time_range": {
                "start": int(data["time"].min()) if not data.empty else 0,
                "end": int(data["time"].max()) if not data.empty else 0,
            },
            "total_records_processed": len(data),
            "anomalies_detected": len(anomalies),
            "is_anomaly": len(anomalies) > 0,
            "affected_devices": devices,
            "anomaly_details": anomalies,
            "summary": {
                "anomaly_rate": round((len(anomalies) / len(data) * 100), 2) if len(data) > 0 else 0,
                "devices_affected": len(devices),
                "high_severity_count": sum(1 for a in anomalies if a["severity"] == "HIGH")
            }
        }

    def empty_result(self, data):
        return self.build_output(data, [])

    def save_output(self, output):
        try:
            with open(self.output_file, "w") as f:
                json.dump(output, f, indent=2)
            logger.info(f"💾 anomaly.json written with {output['anomalies_detected']} anomalies")
        except Exception as e:
            logger.error(f"❌ Failed to write JSON: {e}")

    def run(self):
        logger.info("🚀 Starting real-time anomaly monitoring...")
        try:
            while True:
                result = self.load_new_data()
                if result:
                    new_data, features = result
                    output = self.detect(new_data, features)
                    self.save_output(output)
                else:
                    logger.info("📉 No new metrics. Sleeping...")
                time.sleep(self.check_interval)
        except KeyboardInterrupt:
            logger.info("🛑 Interrupted by user")


def main():
    watcher = RealTimeAnomalyWatcher()
    watcher.run()

if __name__ == "__main__":
    main()
