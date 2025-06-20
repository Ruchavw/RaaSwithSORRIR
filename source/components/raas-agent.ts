import {
  OneWayEvent,
  createStatemachineComponent,
  AtomicComponent,
  StateMachine,
  StateMachineState,
  RaiseEventCallBack
} from "@sorrir/framework";

import { FaultHandlerEventTypes, FaultHandlerPorts } from "./fault-handler";
import * as fs from "fs";
import * as path from "path";

// ✅ Function to read Python-generated anomaly score
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
        const isAnomaly = checkPythonAnomalyFlag();

        if (isAnomaly) {
          raiseEvent({
            type: FaultHandlerEventTypes.FAULT,
            port: RaaSPorts.TO_FAULT_HANDLER,
            eventClass: "oneway"
          });
          console.warn("📡 RaaS Agent: Detected anomaly from Python → FAULT raised");
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
