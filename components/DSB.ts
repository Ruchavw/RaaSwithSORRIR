import {
  RaiseEventCallBack,
  StateMachine,
  StateMachineState,
} from "@sorrir/framework";
import {
  BarrierEventTypes,
  SensorEventTypes,
  DSBEventTypes,
  UserEventTypes,
} from "./events";
import {
  createStatemachineComponent,
  AtomicComponent,
} from "@sorrir/framework";

enum States {
  IDLE = "IDLE",
  SHOW_SELECTION = "SHOW_SELECTION",
  WAITING_FOR_CAR_PASSED = "WAITING_FOR_CAR_PASSED",
}

export enum DSBPorts {
  FROM_SENSOR = "FROM_SENSOR",
  TO_BARRIER = "TO_BARRIER",
  FROM_USER = "FROM_USER",
  TO_USER = "TO_USER",
}

const sm: StateMachine<
  States,
  undefined,
  BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes,
  DSBPorts
> = {
  transitions: [
    {
      sourceState: States.IDLE,
      targetState: States.SHOW_SELECTION,
      event: ["oneway", SensorEventTypes.DETECTION, DSBPorts.FROM_SENSOR],
      action: (
        myState: undefined,
        raiseEvent: RaiseEventCallBack<
          BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes,
          DSBPorts
        >
      ) => {
        raiseEvent({
          eventClass: "oneway",
          type: UserEventTypes.ASK_SELECTION,
          port: DSBPorts.TO_USER,
        });
        return undefined;
      },
    },
    {
      sourceState: States.SHOW_SELECTION,
      targetState: States.WAITING_FOR_CAR_PASSED,
      event: ["oneway", DSBEventTypes.SELECTION_MADE, DSBPorts.FROM_USER],
      action: (
        myState: undefined,
        raiseEvent: RaiseEventCallBack<
          BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes,
          DSBPorts
        >
      ) => {
        raiseEvent({
          eventClass: "oneway",
          type: BarrierEventTypes.OPEN,
          port: DSBPorts.TO_BARRIER,
        });
        return undefined;
      },
    },
    {
      sourceState: States.WAITING_FOR_CAR_PASSED,
      targetState: States.IDLE,
      event: ["oneway", SensorEventTypes.NOTHING, DSBPorts.FROM_SENSOR],
      action: (
        myState: undefined,
        raiseEvent: RaiseEventCallBack<
          BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes,
          DSBPorts
        >
      ) => {
        raiseEvent({
          eventClass: "oneway",
          type: BarrierEventTypes.CLOSE,
          port: DSBPorts.TO_BARRIER,
        });
        return undefined;
      },
    },
  ],
};

export const DSB: AtomicComponent<
  BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes,
  DSBPorts
> = createStatemachineComponent(
  [
    {
      name: DSBPorts.FROM_SENSOR,
      eventTypes: Object.values(SensorEventTypes),
      direction: "in",
    },
    {
      name: DSBPorts.TO_BARRIER,
      eventTypes: Object.values(BarrierEventTypes),
      direction: "out",
    },
    {
      name: DSBPorts.FROM_USER,
      eventTypes: Object.values(DSBEventTypes),
      direction: "in",
    },
    {
      name: DSBPorts.TO_USER,
      eventTypes: Object.values(UserEventTypes),
      direction: "out",
    },
  ],
  sm,
  "DSB"
);

export const DSBStartState: StateMachineState<any, any, undefined, undefined> =
  {
    state: { fsm: States.IDLE, my: undefined },
    events: [],
    tsType: "State",
  };
