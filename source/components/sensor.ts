import {
  RaiseEventCallBack,
  StateMachine,
  StateMachineState,
  createStatemachineComponent,
  AtomicComponent,
} from "@sorrir/framework";

// Generic event types the sensors can emit
export enum GenericSensorEventTypes {
  DETECTION = "DETECTION",
  NOTHING = "NOTHING",
  FAULT = "FAULT",
}

// Ports the sensor can communicate on
export enum GenericSensorPorts {
  TO_DSB = "TO_DSB",
}

// FSM states for the sensors
export enum GenericSensorStates {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  FAULTY = "FAULTY",
}

// Internal memory (tick count)
type GenericSensorMemory = number;

// ✅ Factory function to create sensor FSM for any device
export const createSensorFSM = (
  name: string
): AtomicComponent<GenericSensorEventTypes, GenericSensorPorts> & { sm: StateMachine<GenericSensorStates, GenericSensorMemory, GenericSensorEventTypes, GenericSensorPorts> } => {
  const fsm: StateMachine<
    GenericSensorStates,
    GenericSensorMemory,
    GenericSensorEventTypes,
    GenericSensorPorts
  > = {
    transitions: [
      {
        sourceState: GenericSensorStates.INACTIVE,
        targetState: GenericSensorStates.FAULTY,
        condition: (tick) => tick === -1,
        action: (tick, raiseEvent) => {
          raiseEvent({
            type: GenericSensorEventTypes.FAULT,
            port: GenericSensorPorts.TO_DSB,
            eventClass: "oneway",
          });
          return tick;
        },
      },
      {
        sourceState: GenericSensorStates.ACTIVE,
        targetState: GenericSensorStates.FAULTY,
        condition: (tick) => tick === -1,
        action: (tick, raiseEvent) => {
          raiseEvent({
            type: GenericSensorEventTypes.FAULT,
            port: GenericSensorPorts.TO_DSB,
            eventClass: "oneway",
          });
          return tick;
        },
      },
      {
        sourceState: GenericSensorStates.INACTIVE,
        targetState: GenericSensorStates.ACTIVE,
        action: (tick, raiseEvent) => {
          raiseEvent({
            type: GenericSensorEventTypes.DETECTION,
            port: GenericSensorPorts.TO_DSB,
            eventClass: "oneway",
          });
          return tick + 1;
        },
      },
      {
        sourceState: GenericSensorStates.ACTIVE,
        targetState: GenericSensorStates.ACTIVE,
        condition: (tick) => tick <= 3,
        action: (tick) => tick + 1,
      },
      {
        sourceState: GenericSensorStates.ACTIVE,
        targetState: GenericSensorStates.INACTIVE,
        condition: (tick) => tick > 3,
        action: (tick, raiseEvent) => {
          raiseEvent({
            type: GenericSensorEventTypes.NOTHING,
            port: GenericSensorPorts.TO_DSB,
            eventClass: "oneway",
          });
          return 0;
        },
      },
    ],
  };

  const component = createStatemachineComponent(
    [
      {
        name: GenericSensorPorts.TO_DSB,
        eventTypes: Object.values(GenericSensorEventTypes),
        direction: "out",
      },
    ],
    fsm,
    name
  );

  // ✅ Return both the component and FSM itself
  return { sm: fsm, ...component };
};

// ✅ Sensor Instances
export const cam1Sensor = createSensorFSM("cam-1");
export const cam2Sensor = createSensorFSM("cam-2");
export const cloudSensor = createSensorFSM("cloud");
export const fog0Sensor = createSensorFSM("fog-0");
export const irrigationSensor = createSensorFSM("irrigation-controller");
export const soilSensor = createSensorFSM("soil-sensor-node");
export const signalMonitorSensor = createSensorFSM("signal-monitor");

// ✅ Start states for each sensor
export const genericStartState = (
  initial: GenericSensorStates = GenericSensorStates.INACTIVE
): StateMachineState<
  GenericSensorStates,
  GenericSensorMemory,
  GenericSensorEventTypes,
  GenericSensorPorts
> => ({
  state: { fsm: initial, my: 0 },
  events: [],
  tsType: "State",
});
