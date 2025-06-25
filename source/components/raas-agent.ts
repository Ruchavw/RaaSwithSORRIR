import {
  OneWayEvent,
  createStatemachineComponent,
  AtomicComponent,
  StateMachine,
  StateMachineState,
  RaiseEventCallBack
} from "@sorrir/framework";

import { FaultHandlerEventTypes } from "./fault-handler";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ✅ FSM States
enum States {
  ANALYZING = "ANALYZING",
  RECOVERING = "RECOVERING",
}

// ✅ Ports
export enum RaaSPorts {
  TO_FAULT_HANDLER = "TO_FAULT_HANDLER",
}

// ✅ Anomaly Detection Helper
function checkPythonAnomalyFlag(): boolean {
  try {
    const dataPath = path.resolve("data/outputs/anomaly.json");
    const jsonData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    return jsonData?.is_anomaly === true;
  } catch (e) {
    console.warn("⚠️ RaaS Agent: Failed to read anomaly.json. Assuming normal.");
    return false;
  }
}

// ✅ FSM Definition
export const sm: StateMachine<States, undefined, FaultHandlerEventTypes, RaaSPorts> = {
  transitions: [
    {
      sourceState: States.ANALYZING,
      targetState: States.RECOVERING,
      action: (_, raiseEvent) => {
        if (checkPythonAnomalyFlag()) {
          raiseEvent({
            type: FaultHandlerEventTypes.FAULT,
            port: RaaSPorts.TO_FAULT_HANDLER,
            eventClass: "oneway"
          });

          console.warn("📡 RaaS Agent: Detected anomaly → FAULT raised");

          try {
            // Restart via WSL-compatible path
            execSync("bash recover/restart_faulty.sh", {
              cwd: path.resolve("faulty-app"),
              stdio: "inherit"
            });
            console.log("✅ RaaS Agent: Faulty app restarted.");
          } catch (err) {
            console.error("❌ RaaS Agent: Recovery script failed.");
          }

          fs.appendFileSync("data/outputs/recovery_attempt.log",
            `Edge recovery triggered at ${new Date().toISOString()}\n`
          );
        } else {
          console.log("✅ RaaS Agent: No anomaly detected.");
        }

        return;
      },
    },
    {
      sourceState: States.RECOVERING,
      targetState: States.ANALYZING,
      action: () => {
        console.log("🔁 RaaS Agent: Returning to ANALYZING.");
      },
    },
  ],
};

// ✅ Component Export
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

// ✅ Initial State
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
