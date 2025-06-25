# ride_fsm_plot.py
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import json

fsm_log_path = "data/outputs/fsm_log.json"

# Load the FSM log
with open(fsm_log_path, "r") as f:
    logs = json.load(f)

df = pd.DataFrame(logs)

# Convert cycle to integer
df["cycle"] = df["cycle"].astype(int)

# Plot
plt.figure(figsize=(10, 6))
sns.lineplot(data=df, x="cycle", y="rideC", label="RIDE-C State", marker="o")
sns.lineplot(data=df, x="cycle", y="rideD", label="RIDE-D State", marker="s")
plt.title("📊 RIDE FSM Transitions Over Time")
plt.xlabel("Cycle")
plt.ylabel("FSM State")
plt.legend()
plt.tight_layout()

# Save and show
plt.savefig("visualizations/output/ride_fsm_plot.png")
plt.show()
