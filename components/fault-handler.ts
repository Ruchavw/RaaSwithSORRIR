import {
  AtomicComponent,
  StateMachine,
  StateMachineState,
  RaiseEventCallBack,
  createStatemachineComponent,
} from "@sorrir/framework";

// Define fault handler event types
export enum FaultHandlerEventTypes {
  FAULT = "FAULT",
  OK = "OK",
}

// Define the ports for the fault handler
export enum FaultHandlerPorts {
  FROM_SENSOR = "FROM_SENSOR",
}

// FSM states
enum FHStates {
  MONITORING = "MONITORING",
  FAULTED = "FAULTED",
}

// Internal state type
type abstractState = {
  faultCount: number;
};

// ✅ State machine with auto-recovery logic
const sm: StateMachine<
  FHStates,
  abstractState,
  FaultHandlerEventTypes,
  FaultHandlerPorts
> = {
  transitions: [
    {
      sourceState: FHStates.MONITORING,
      targetState: FHStates.FAULTED,
      event: ["oneway", FaultHandlerEventTypes.FAULT, FaultHandlerPorts.FROM_SENSOR],
      action: (state) => {
        console.warn("⚠️ FAULT DETECTED by Fault Handler!");
        return { faultCount: 0 };
      },
    },
    {
      sourceState: FHStates.FAULTED,
      targetState: FHStates.FAULTED,
      condition: (state) => state.faultCount < 1,
      action: (state) => {
        return { faultCount: state.faultCount + 1 };
      },
    },
    {
      sourceState: FHStates.FAULTED,
      targetState: FHStates.MONITORING,
      condition: (state) => state.faultCount >= 1,
      action: (state) => {
        console.log("✅ FAULT RESOLVED automatically.");
        return { faultCount: 0 };
      },
    },
  ],
};

// Create the atomic component
export const faultHandler: AtomicComponent<
  FaultHandlerEventTypes,
  FaultHandlerPorts
> = createStatemachineComponent(
  [
    {
      name: FaultHandlerPorts.FROM_SENSOR,
      direction: "in",
      eventTypes: Object.values(FaultHandlerEventTypes),
    },
  ],
  sm,
  "fault-handler"
);

// Initial state
export const faultHandlerStartState: StateMachineState<
  FHStates,
  abstractState,
  FaultHandlerEventTypes,
  FaultHandlerPorts
> = {
  state: { fsm: FHStates.MONITORING, my: { faultCount: 0 } },
  events: [],
  tsType: "State",
};

// Export the state machine
export { sm };
