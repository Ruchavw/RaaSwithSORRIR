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

import { coreApplicationLogic } from "./core-app";

// ✅ For dashboard logging
const logs: any[] = [];

// Generic state machine runner
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

export const example_config = {
  run: async () => {
    let sensorState = sensorStartState;
    let faultHandlerState = faultHandlerStartState;
    let raasState = raasAgentStartState;

    for (let i = 0; i < 5; i++) {
      console.log(`\n🔁 Cycle ${i + 1}`);

      // Run application logic (simulated)
      coreApplicationLogic();

      if (i === 2) {
        console.log("⚠️ Injecting fault in sensor (my = -1)");
        sensorState.state.my = -1;
      }

      // Step 1: Sensor FSM
      const sensorResult = runTransition(sensorSM, sensorState);
      sensorState = sensorResult.newState;

      // Step 2: RaaS Agent (reads from anomaly.json)
      const raasResult = runTransition(raasSM, raasState);
      raasState = raasResult.newState;

      // Step 3: Fault Handler handles events from RaaS Agent
      const faultResult = runTransition(
        faultSM,
        faultHandlerState,
        raasResult.raisedEvents
      );
      faultHandlerState = faultResult.newState;

      // Run again (as unaffected core logic)
      coreApplicationLogic();

      // Logging states
      console.log(`📡 Sensor FSM: ${sensorState.state.fsm}`);
      console.log(`📡 RaaS Events: ${raasResult.raisedEvents.map(e => e.type).join(", ") || "None"}`);
      console.log(`🛡️ FaultHandler FSM: ${faultHandlerState.state.fsm}`);

      // Log for dashboard
      logs.push({
        cycle: i + 1,
        sensorState: sensorState.state.fsm,
        raasEvents: raasResult.raisedEvents.map((e) => e.type),
        faultHandlerState: faultHandlerState.state.fsm,
      });
    }

    console.log("\n📋 Final Transition Log:");
    console.table(logs);
    console.log("\n✅ Simulation finished.");
  },
};

// Run directly
if (require.main === module) {
  console.log("🚀 Starting mock-model simulation...");
  example_config.run();
}
