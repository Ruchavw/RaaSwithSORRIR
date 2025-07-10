import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os

fsm_log_path = "data/outputs/fsm_log_full.json"
output_dir = "visualizations/output"
output_file = os.path.join(output_dir, "ride_fsm_plot_annotated.png")

# Ensure directory
os.makedirs(output_dir, exist_ok=True)

# Load FSM logs
with open(fsm_log_path, "r") as f:
    logs = json.load(f)

# Convert to DataFrame
if isinstance(logs, dict):
    df = pd.DataFrame([logs])
    df["cycle"] = [1]
else:
    df = pd.DataFrame(logs)

# Convert cycle to int
df["cycle"] = df["cycle"].astype(int)

# Map RIDE states
state_map = {
    "MONITOR": 0,
    "RECOVERING": 1,
    "NORMAL": 2,
    "IDLE": 0,
    "FORWARDING": 1,
    "REROUTING": 2,
    "RECOVERED": 3
}

# Normalize column names if needed
if "ride_c_state" in df.columns:
    df["rideC"] = df["ride_c_state"]
if "ride_d_state" in df.columns:
    df["rideD"] = df["ride_d_state"]

df["rideC_code"] = df["rideC"].map(state_map)
df["rideD_code"] = df["rideD"].map(state_map)

# Plot
plt.figure(figsize=(14, 7))
sns.lineplot(data=df, x="cycle", y="rideC_code", label="RIDE-C", marker="o", linewidth=2)
sns.lineplot(data=df, x="cycle", y="rideD_code", label="RIDE-D", marker="s", linewidth=2)

# Annotations for transitions
for i in range(1, len(df)):
    if df["rideC_code"][i] != df["rideC_code"][i - 1]:
        plt.annotate(df["rideC"][i], (df["cycle"][i], df["rideC_code"][i]),
                     textcoords="offset points", xytext=(0, 10), ha='center', fontsize=9, color='blue')
    if df["rideD_code"][i] != df["rideD_code"][i - 1]:
        plt.annotate(df["rideD"][i], (df["cycle"][i], df["rideD_code"][i]),
                     textcoords="offset points", xytext=(0, -15), ha='center', fontsize=9, color='green')

# Labels
plt.title("📊 RIDE FSM Transitions Over Time (with Annotations)")
plt.xlabel("Cycle")
plt.ylabel("FSM State (Code)")
plt.yticks([0, 1, 2, 3], ["MONITOR / IDLE", "RECOVERING / REROUTING", "NORMAL / FORWARDING", "RECOVERED"])
plt.grid(True)
plt.legend()
plt.tight_layout()

# Save & Show
plt.savefig(output_file)
plt.show()
