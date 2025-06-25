import * as fs from "fs";
import { exec } from "child_process";

import {
  AtomicComponent,
  StateMachineState,
  OneWayEvent,
} from "@sorrir/framework";

import {
  sensor,
  sensorStartState,
  SensorEventTypes,
  SensorPorts,
  sm as sensorSM,
} from "./components/sensor";

import {
  faultHandler,
  faultHandlerStartState,
  FaultHandlerEventTypes,
  FaultHandlerPorts,
  sm as faultSM,
} from "./components/fault-handler";

import {
  raasAgent,
  raasAgentStartState,
  sm as raasSM,
  RaaSPorts,
} from "./components/raas-agent";

import {
  rideC,
  rideCStartState,
  sm as rideCSM,
} from "./components/ride-c";

import {
  rideD,
  rideDStartState,
  sm as rideDSM,
} from "./components/ride-d";

import { coreApplicationLogic } from "./core-app";

const fsmLogPath = "data/outputs/fsm_log.json";

// ✅ Generic transition runner
function runTransition<TState, TMy, TEvent, TPort>(
  fsm: any,
  state: StateMachineState<TState, TMy, TEvent, TPort>,
  incomingEvents: OneWayEvent<TEvent, TPort>[] = []
): {
  newState: StateMachineState<TState, TMy, TEvent, TPort>;
  raisedEvents: OneWayEvent<TEvent, TPort>[];
} {
  const raisedEvents: OneWayEvent<TEvent, TPort>[] = [];

  const transition = fsm.transitions.find((t: any) => {
    if (t.sourceState !== state.state.fsm) return false;

    if (t.event) {
      const [ec, etype, eport] = t.event;
      return incomingEvents.some(
        (e) => e.eventClass === ec && e.type === etype && e.port === eport
      );
    }

    if (t.condition) {
      return t.condition(state.state.my);
    }

    return true;
  });

  const newMy = transition?.action
    ? transition.action(state.state.my, (e: any) => raisedEvents.push(e))
    : state.state.my;

  return {
    newState: {
      state: {
        fsm: transition ? transition.targetState : state.state.fsm,
        my: newMy,
      },
      events: [],
      tsType: "State",
    },
    raisedEvents,
  };
}

// ✅ FSM Simulation Config
export const example_config = {
  run: async () => {
    let sensorState = sensorStartState;
    let faultHandlerState = faultHandlerStartState;
    let raasState = raasAgentStartState;
    let rideCState = rideCStartState;
    let rideDState = rideDStartState;

    const logs: any[] = [];

    for (let i = 0; i < 5; i++) {
      console.log(`\n🔁 Cycle ${i + 1}`);
      coreApplicationLogic();

      if (i === 2) {
        console.log("⚠️ Injecting fault in sensor (my = -1)");
        sensorState.state.my = -1;
      }

      const sensorResult = runTransition(sensorSM, sensorState);
      sensorState = sensorResult.newState;

      const raasResult = runTransition(raasSM, raasState);
      raasState = raasResult.newState;

      const faultResult = runTransition(
        faultSM,
        faultHandlerState,
        raasResult.raisedEvents
      );
      faultHandlerState = faultResult.newState;

      const rideCResult = runTransition(rideCSM, rideCState, raasResult.raisedEvents);
      rideCState = rideCResult.newState;

      const rideDResult = runTransition(rideDSM, rideDState, rideCResult.raisedEvents);
      rideDState = rideDResult.newState;

      coreApplicationLogic();

      logs.push({
        cycle: i + 1,
        sensorState: sensorState.state.fsm,
        raasEvents: raasResult.raisedEvents.map(e => e.type),
        faultHandlerState: faultHandlerState.state.fsm,
        rideC: rideCState.state.fsm,
        rideD: rideDState.state.fsm,
      });

      // Intermediate write (optional)
      fs.writeFileSync(
        fsmLogPath,
        JSON.stringify({
          ride_c_state: rideCState.state.fsm,
          ride_d_state: rideDState.state.fsm,
          recovery_triggered: rideCState.state.fsm === "RECOVERING" ? 1 : 0
        }, null, 2)
      );

      // 🖨️ Console output
      console.log(`📡 Sensor FSM: ${sensorState.state.fsm}`);
      console.log(`📡 RaaS Events: ${raasResult.raisedEvents.map(e => e.type).join(", ") || "None"}`);
      console.log(`🛡️ FaultHandler FSM: ${faultHandlerState.state.fsm}`);
      console.log(`🛠️ RIDE-C FSM: ${rideCState.state.fsm}`);
      console.log(`🔁 RIDE-D FSM: ${rideDState.state.fsm}`);
    }

    // ✅ Save all FSM logs to file
    console.log("\n📋 Final Transition Log:");
    console.table(logs);
    fs.writeFileSync(fsmLogPath, JSON.stringify(logs, null, 2));

    // ✅ Generate graph
    exec("python visualizations/ride_fsm_plot.py", (err, stdout, stderr) => {
      if (err) {
        console.error("❌ FSM plot error:", stderr);
      } else {
        console.log("✅ ride_fsm_plot.py executed.\n", stdout);
      }
    });

    console.log("\n✅ Simulation finished.");
  }
};

// ✅ Execute if run directly
if (require.main === module) {
  console.log("🚀 Starting mock-model simulation...");
  example_config.run();
}
