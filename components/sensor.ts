import {
  RaiseEventCallBack,
  StateMachine,
  StateMachineState,
  createStatemachineComponent,
  AtomicComponent,
} from "@sorrir/framework";

// Event types the sensor can emit
export enum SensorEventTypes {
  DETECTION = "DETECTION",
  NOTHING = "NOTHING",
  FAULT = "FAULT",
}

// Ports the sensor can communicate on
export enum SensorPorts {
  TO_DSB = "TO_DSB",
}

// FSM states for the sensor
export enum States {
  CAR = "CAR",
  NO_CAR = "NO_CAR",
  FAULTY = "FAULTY",
}

// Sensor’s internal memory (tick count)
type abstractState = number;

// ✅ State machine definition
export const sm: StateMachine<States, abstractState, SensorEventTypes, SensorPorts> = {
  transitions: [
    //⚠️ Fault transition from NO_CAR
    {
      sourceState: States.NO_CAR,
      targetState: States.FAULTY,
      condition: (tick) => tick === -1,
      action: (tick, raiseEvent) => {
        raiseEvent({ type: SensorEventTypes.FAULT, port: SensorPorts.TO_DSB, eventClass: "oneway" });
        return tick;
      },
    },
    // ⚠️ Fault transition from CAR
    {
      sourceState: States.CAR,
      targetState: States.FAULTY,
      condition: (tick) => tick === -1,
      action: (tick, raiseEvent) => {
        raiseEvent({ type: SensorEventTypes.FAULT, port: SensorPorts.TO_DSB, eventClass: "oneway" });
        return tick;
      },
    },
    // ✅ Normal detection (CAR arrives)
    {
      sourceState: States.NO_CAR,
      targetState: States.CAR,
      action: (tick, raiseEvent) => {
        raiseEvent({ type: SensorEventTypes.DETECTION, port: SensorPorts.TO_DSB, eventClass: "oneway" });
        return tick + 1;
      },
    },
    // ⏱ Stay in CAR up to 3 ticks
    {
      sourceState: States.CAR,
      targetState: States.CAR,
      condition: (tick) => tick <= 3,
      action: (tick) => tick + 1,
    },
    // ⬅️ Reset to NO_CAR after CAR state ends
    {
      sourceState: States.CAR,
      targetState: States.NO_CAR,
      condition: (tick) => tick > 3,
      action: (tick, raiseEvent) => {
        raiseEvent({ type: SensorEventTypes.NOTHING, port: SensorPorts.TO_DSB, eventClass: "oneway" });
        return 0;
      },
    },
  ],
};

// ✅ Component creation
export const sensor: AtomicComponent<SensorEventTypes, SensorPorts> = createStatemachineComponent(
  [
    {
      name: SensorPorts.TO_DSB,
      eventTypes: Object.values(SensorEventTypes),
      direction: "out",
    },
  ],
  sm,
  "sensor"
);

// ✅ Start state
export const sensorStartState: StateMachineState<States, abstractState, SensorEventTypes, SensorPorts> = {
  state: { fsm: States.NO_CAR, my: 0 },
  events: [],
  tsType: "State",
};
