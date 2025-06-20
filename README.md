# RaaSwithSORRIR
## Directory Structure
example-1-mvp/
│
├── 📁 data/
│   ├── 📁 inputs/
│   │   └── edge_metrics.csv                 # ✅ Input sensor/device data
│   ├── 📁 outputs/
│   │   ├── anomalies.csv                    # ✅ Output from Isolation Forest
│   │   ├── anomaly.json                     # ✅ Used by RaaS Agent in TS
│   │   └── anomaly_report.txt               # ✅ Text summary for analysis
│
├── 📁 models/
│   └── isolation_forest.py                  # ✅ Isolation Forest logic
│
├── 📁 visualizations/
│   ├── anomaly_plots.py                     # ✅ Seaborn + Matplotlib plots
│   └── 📁 output/
│       ├── cpu_ram_anomalies.png
│       ├── anomaly_plot.png
│       ├── anomaly_score_histogram.png
│       ├── anomaly_timeline.png
│       ├── device_anomaly_summary.png
│       └── feature_distributions.png
│
├── 📁 source/
│   ├── 📁 components/
│   │   ├── barrier.ts                       # (If needed)
│   │   ├── dsb.ts                           # (If needed)
│   │   ├── events.ts                        # Event type definitions
│   │   ├── fault-handler.ts                 # ✅ Fault handler FSM
│   │   ├── index.ts                         # Entry point for component exports
│   │   ├── raas-agent.ts                    # ✅ Updated to read `anomaly.json`
│   │   ├── sensor.ts                        # ✅ Sensor FSM
│   │   └── user.ts                          # (If needed)
│   │
│   ├── core-app.ts                          # ✅ Simulates unaffected logic
│   └── mock-model.ts                        # ✅ Main FSM runner (uses SORRIR + ML)
│
├── run_sim.py                               # ✅ End-to-end ML pipeline runner
├── package.json                             # Your npm dependencies
├── tsconfig.json                            # TypeScript config
├── README.md                                # (Optional)
└── .gitignore                               

