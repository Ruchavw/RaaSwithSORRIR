# RaaSwithSORRIR
## Directory Structure
```sh
raas-mvp/
├── source/
│   ├── components/
│   │   ├── sensor.ts
│   │   ├── fault-handler.ts
│   │   ├── raas-agent.ts      ← ✅ RaaS agent reads anomaly.json here
│   ├── core-app.ts            ← ✅ Core unaffected logic
│   ├── mock-model.ts          ← ✅ Main simulation orchestrator
│
├── model/
│   ├── train_model.py         ← ✅ Trains and saves the model
│   ├── infer_model.py         ← ✅ Reads live data, writes to anomaly.json
│   ├── isolation-train.csv    ← ✅ Training data
│   ├── live-sensor.csv        ← ✅ Simulated incoming readings
│   ├── anomaly.json           ← ✅ Written by Python, read by TypeScript
│
├── package.json
├── tsconfig.json
├── README.md (optional)
```
