import {
  OneWayEvent,
  RaiseEventCallBack,
  StateMachine,
  StateMachineState,
} from "@sorrir/framework";
import { UserEventTypes, DSBEventTypes } from "./events";
import {
  createStatemachineComponent,
  AtomicComponent,
} from "@sorrir/framework";

enum States {
  WAITING = "WAITING",
}

export enum UserPorts {
  TO_DSB = "TO_DSB",
  FROM_DSB = "FROM_DSB",
}

type abstract_state = undefined;

const sm: StateMachine<
  States,
  abstract_state,
  UserEventTypes | DSBEventTypes,
  UserPorts
> = {
  transitions: [
    {
      sourceState: States.WAITING,
      targetState: States.WAITING,
      event: ["oneway", UserEventTypes.ASK_SELECTION, UserPorts.FROM_DSB],
      action: (
        _,
        raiseEvent: RaiseEventCallBack<
          UserEventTypes | DSBEventTypes,
          UserPorts
        >
      ) => {
        const event: Omit<
          OneWayEvent<DSBEventTypes.SELECTION_MADE, UserPorts.TO_DSB>,
          "id"
        > = {
          type: DSBEventTypes.SELECTION_MADE,
          port: UserPorts.TO_DSB,
          eventClass: "oneway",
        };
        raiseEvent(event);
        return _;
      },
    },
  ],
};

export const user: AtomicComponent<UserEventTypes | DSBEventTypes, UserPorts> =
  createStatemachineComponent(
    [
      {
        name: UserPorts.FROM_DSB,
        eventTypes: Object.values(UserEventTypes),
        direction: "in",
      },
      {
        name: UserPorts.TO_DSB,
        eventTypes: Object.values(DSBEventTypes),
        direction: "out",
      },
    ],
    sm,
    "user"
  );

export const userStartState: StateMachineState<any, any, undefined, undefined> =
  {
    state: { fsm: States.WAITING, my: undefined },
    events: [],
    tsType: "State",
  };
