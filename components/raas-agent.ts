import {
  OneWayEvent,
  createStatemachineComponent,
  AtomicComponent,
  StateMachine,
  StateMachineState,
  RaiseEventCallBack,
} from "@sorrir/framework";

import { FaultHandlerEventTypes, FaultHandlerPorts } from "./fault-handler";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

// ✅ Read anomaly detection output
function checkPythonAnomalyFlag(): { isAnomaly: boolean; score?: number } {
  try {
    const dataPath = path.resolve("data/outputs/anomaly.json");
    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    return {
      isAnomaly: jsonData?.is_anomaly === true,
      score: jsonData?.anomaly_score,
    };
  } catch (e) {
    console.warn("⚠️ RaaS Agent: Failed to read anomaly.json. Assuming normal.");
    return { isAnomaly: false };
  }
}

// ✅ FSM definition
enum States {
  ANALYZING = "ANALYZING",
}

export enum RaaSPorts {
  TO_FAULT_HANDLER = "TO_FAULT_HANDLER",
}

export const sm: StateMachine<States, undefined, FaultHandlerEventTypes, RaaSPorts> = {
  transitions: [
    {
      sourceState: States.ANALYZING,
      targetState: States.ANALYZING,
      action: (
        _,
        raiseEvent: RaiseEventCallBack<FaultHandlerEventTypes, RaaSPorts>
      ) => {
        const { isAnomaly, score } = checkPythonAnomalyFlag();

        if (isAnomaly) {
          raiseEvent({
            type: FaultHandlerEventTypes.FAULT,
            port: RaaSPorts.TO_FAULT_HANDLER,
            eventClass: "oneway",
          });

          console.warn("📡 RaaS Agent: Detected anomaly from Python → FAULT raised");
          console.log(`📊 Anomaly detected! Score: ${score}`);

          // ✅ Safe recovery log (fixes "No such file" error)
          exec(
            `mkdir -p ./data/outputs && echo "Edge recovery triggered at ${new Date().toISOString()}" >> ./data/outputs/recovery_attempt.log`,
            (err) => {
              if (err) {
                console.error("❌ Recovery logging failed:", err.message);
              }
            }
          );

          // ✅ Restart the faulty container
          exec(`docker restart faulty-app`, (err, stdout, stderr) => {
            if (err) {
              console.error("❌ RaaS Agent: Recovery script failed.");
              console.error(stderr);
            } else {
              console.log(stdout.trim());
              console.log("✅ RaaS Agent: Faulty app restarted.");
            }
          });
        } else {
          console.log("✅ RaaS Agent: No anomaly, system normal.");
        }

        return;
      },
    },
  ],
};

export const raasAgent: AtomicComponent<FaultHandlerEventTypes, RaaSPorts> =
  createStatemachineComponent(
    [
      {
        name: RaaSPorts.TO_FAULT_HANDLER,
        eventTypes: Object.values(FaultHandlerEventTypes),
        direction: "out",
      },
    ],
    sm,
    "raas-agent"
  );

export const raasAgentStartState: StateMachineState<
  States,
  undefined,
  FaultHandlerEventTypes,
  RaaSPorts
> = {
  state: { fsm: States.ANALYZING, my: undefined },
  events: [],
  tsType: "State",
};
