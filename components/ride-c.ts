import {
  AtomicComponent,
  createStatemachineComponent,
  StateMachine,
  StateMachineState,
  RaiseEventCallBack,
  OneWayEvent,
} from "@sorrir/framework";

export enum RideCPorts {
  TO_RIDE_D = "TO_RIDE_D",
}

export enum RideCEventTypes {
  RECOVERY = "RECOVERY",
  FAULT = "FAULT",
}

enum RideCStates {
  MONITOR = "MONITOR",
  RECOVERING = "RECOVERING",
}

// Simulated healthy paths
const healthyPaths = new Set<string>(["path-A", "path-B", "path-C"]);

export const sm: StateMachine<RideCStates, { paths: string[] }, RideCEventTypes, RideCPorts> = {
  transitions: [
    {
      sourceState: RideCStates.MONITOR,
      targetState: RideCStates.RECOVERING,
      event: ["oneway", RideCEventTypes.FAULT, undefined],

      action: (my, raiseEvent) => {
        // Simulate smart casting
        const goodPaths = Array.from(healthyPaths);

        raiseEvent({
          type: RideCEventTypes.RECOVERY,
          port: RideCPorts.TO_RIDE_D,
          eventClass: "oneway",
          payload: {
            suggestedPaths: goodPaths,
          },
        });

        console.log("📡 RIDE-C: Suggested good paths →", goodPaths);
        console.log("🛠️ RIDE-C: Entered RECOVERING mode — smart casting paths...");

        return { paths: goodPaths };
      },
    },
    {
      sourceState: RideCStates.RECOVERING,
      targetState: RideCStates.MONITOR,
    },
  ],
};

export const rideC = createStatemachineComponent(
  [
    {
      name: RideCPorts.TO_RIDE_D,
      direction: "out",
      eventTypes: Object.values(RideCEventTypes),
    },
  ],
  sm,
  "ride-c"
);

export const rideCStartState: StateMachineState<
  RideCStates,
  { paths: string[] },
  RideCEventTypes,
  RideCPorts
> = {
  state: { fsm: RideCStates.MONITOR, my: { paths: [] } },
  events: [],
  tsType: "State",
};
