import * as fs from "fs";
import { exec } from "child_process";
import {
  StateMachineState,
  OneWayEvent,
} from "@sorrir/framework";

// FSMs
import * as sensors from "./components/sensor";
import { faultHandler, faultHandlerStartState, sm as faultSM } from "./components/fault-handler";
import { raasAgent, raasAgentStartState, sm as raasSM } from "./components/raas-agent";
import { rideC, rideCStartState, sm as rideCSM } from "./components/ride-c";
import { rideD, rideDStartState, sm as rideDSM } from "./components/ride-d";
import { coreApplicationLogic } from "./core-app";

function runTransition<TState, TMy, TEvent, TPort>(
  fsm: any,
  state: StateMachineState<TState, TMy, TEvent, TPort>,
  incomingEvents: OneWayEvent<TEvent, TPort>[] = []
) {
  const raisedEvents: OneWayEvent<TEvent, TPort>[] = [];
  const transition = fsm.transitions.find((t: any) => {
    if (t.sourceState !== state.state.fsm) return false;
    if (t.event) {
      const [ec, etype, eport] = t.event;
      return incomingEvents.some(
        (e) => e.eventClass === ec && e.type === etype && e.port === eport
      );
    }
    return t.condition ? t.condition(state.state.my) : true;
  });
  const newMy = transition?.action
    ? transition.action(state.state.my, (e: any) => raisedEvents.push(e), incomingEvents[0])
    : state.state.my;
  return {
    newState: {
      state: {
        fsm: transition ? transition.targetState : state.state.fsm,
        my: newMy,
      },
      events: raisedEvents,
      tsType: "State",
    },
    raisedEvents,
  };
}

const anomalyPath = "data/outputs/anomaly.json";
const fsmLogPath = "data/outputs/fsm_log.json";
const fsmLogFullPath = "data/outputs/fsm_log_full.json";  // <-- full log path

export const example_config = {
  run: async () => {
    const sensorsArray = [
      { name: "cam-1", fsm: sensors.cam1Sensor, state: sensors.genericStartState() },
      { name: "cam-2", fsm: sensors.cam2Sensor, state: sensors.genericStartState() },
      { name: "cloud", fsm: sensors.cloudSensor, state: sensors.genericStartState() },
      { name: "fog-0", fsm: sensors.fog0Sensor, state: sensors.genericStartState() },
      { name: "irrigation-controller", fsm: sensors.irrigationSensor, state: sensors.genericStartState() },
      { name: "soil-sensor-node", fsm: sensors.soilSensor, state: sensors.genericStartState() },
      { name: "signal-monitor", fsm: sensors.signalMonitorSensor, state: sensors.genericStartState() },
    ];

    let faultHandlerState = faultHandlerStartState;
    let raasState = raasAgentStartState;
    let rideCState = rideCStartState;
    let rideDState = rideDStartState;

    const logs: any[] = [];
    let rideCRecoveryCycle: number | null = null;
    let rideDRecoveryCycle: number | null = null;

    while (!fs.existsSync(anomalyPath)) {
      console.log("⏳ Waiting for anomaly.json...");
      await new Promise((r) => setTimeout(r, 2000));
    }

    for (let i = 0; i < 20; i++) {
      console.log(`\n🔁 Cycle ${i + 1}`);
      coreApplicationLogic();

      let affectedDevices: string[] = [];
      try {
        const anomalyRaw = fs.readFileSync(anomalyPath, "utf-8");
        const anomaly = JSON.parse(anomalyRaw);
        if (anomaly?.is_anomaly) {
          affectedDevices = Object.keys(anomaly.affected_devices);
          console.log(`🚨 Anomalies found on devices: ${affectedDevices.join(", ")}`);
        }
      } catch (err) {
        console.warn("⚠️ Failed to read anomaly.json, continuing...");
      }

      const isAnomaly = affectedDevices.length > 0;

      sensorsArray.forEach((s) => {
        if (affectedDevices.includes(s.name)) s.state.state.my = -1;
        else if (s.state.state.my === -1) s.state.state.my = 0;
      });

      sensorsArray.forEach((sensor) => {
        const result = runTransition(sensor.fsm.sm, sensor.state);
        sensor.state = result.newState;
        console.log(`📡 ${sensor.name} FSM: ${sensor.state.state.fsm}`);
      });

      const raasResult = runTransition(raasSM, raasState);
      raasState = raasResult.newState;

      faultHandlerState = runTransition(faultSM, faultHandlerState, raasResult.raisedEvents).newState;

      if (isAnomaly && rideCState.state.fsm === "MONITOR") {
        rideCState = runTransition(rideCSM, rideCState, [
          { eventClass: "oneway", type: "FAULT", port: undefined },
        ]).newState;
        rideCRecoveryCycle = i;
      } else if (rideCRecoveryCycle !== null && i - rideCRecoveryCycle >= 2) {
        rideCState = runTransition(rideCSM, rideCState).newState;
        rideCRecoveryCycle = null;
      }

      const rideDResult = runTransition(rideDSM, rideDState, rideCState.events);
      rideDState = rideDResult.newState;

      if (rideDState.state.fsm === "REROUTING") {
        if (rideDRecoveryCycle === null) rideDRecoveryCycle = i;
        else if (i - rideDRecoveryCycle >= 2) {
          rideDState = runTransition(rideDSM, rideDState).newState;
          rideDRecoveryCycle = null;
        }
      }

      logs.push({
        cycle: i + 1,
        sensors: sensorsArray.map((s) => `${s.name}:${s.state.state.fsm}`).join(" | "),
        raasEvents: raasResult.raisedEvents.map((e) => e.type),
        faultHandler: faultHandlerState.state.fsm,
        rideC: rideCState.state.fsm,
        rideD: rideDState.state.fsm,
      });

      fs.writeFileSync(
        fsmLogPath,
        JSON.stringify({
          ride_c_state: rideCState.state.fsm,
          ride_d_state: rideDState.state.fsm,
          recovery_triggered: rideCState.state.fsm === "RECOVERING" ? 1 : 0,
        }, null, 2)
      );

      // ✅ Write full FSM log after each cycle
      fs.writeFileSync(
        fsmLogFullPath,
        JSON.stringify(logs, null, 2)
      );

      console.log(`📡 RaaS Events: ${raasResult.raisedEvents.map((e) => e.type).join(", ") || "None"}`);
      console.log(`🛡️ FaultHandler FSM: ${faultHandlerState.state.fsm}`);
      console.log(`🛠️ RIDE-C FSM: ${rideCState.state.fsm}`);
      console.log(`🔁 RIDE-D FSM: ${rideDState.state.fsm}`);

      await new Promise((res) => setTimeout(res, 5000));
    }

    console.log("\n📋 Final Transition Table:");
    console.table(logs);

    exec("python visualizations/ride_fsm_plot.py", (err, stdout, stderr) => {
      if (err) console.error("❌ FSM plot error:", stderr);
      else console.log("✅ ride_fsm_plot.py executed.\n", stdout);
    });

    console.log("✅ Simulation finished.");
  }
};

if (require.main === module) {
  console.log("🚀 Starting mock-model simulation...");
  example_config.run();
}
