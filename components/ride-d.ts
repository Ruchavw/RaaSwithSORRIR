import {
  AtomicComponent,
  createStatemachineComponent,
  StateMachine,
  StateMachineState,
  OneWayEvent,
  RaiseEventCallBack,
} from "@sorrir/framework";

enum RideDStates {
  FORWARDING = "FORWARDING",
  REROUTING = "REROUTING",
}

export enum RideDPorts {
  FINAL_OUTPUT = "FINAL_OUTPUT",
}

export const sm: StateMachine<RideDStates, { currentPath: string | null }, any, RideDPorts> = {
  transitions: [
    {
      sourceState: RideDStates.FORWARDING,
      targetState: RideDStates.REROUTING,
      event: ["oneway", "RECOVERY", "TO_RIDE_D"],
      action: (my, _, event) => {
        const suggestedPaths = event?.payload?.suggestedPaths || [];
        const selectedPath = suggestedPaths.length > 0 ? suggestedPaths[0] : "fallback";
        console.log(`🚦 RIDE-D: Switching to path → ${selectedPath}`);
        return { currentPath: selectedPath };
      },
    },
    {
      sourceState: RideDStates.REROUTING,
      targetState: RideDStates.FORWARDING,
      action: (my) => {
        console.log(`📤 RIDE-D: Now forwarding via ${my?.currentPath}`);
        return my;
      },
    },
  ],
};

export const rideD: AtomicComponent<any, RideDPorts> = createStatemachineComponent(
  [
    {
      name: RideDPorts.FINAL_OUTPUT,
      eventTypes: ["FORWARDED"],
      direction: "out",
    },
  ],
  sm,
  "ride-d"
);

export const rideDStartState: StateMachineState<
  RideDStates,
  { currentPath: string | null },
  any,
  RideDPorts
> = {
  state: { fsm: RideDStates.FORWARDING, my: { currentPath: null } },
  events: [],
  tsType: "State",
};
