import { StateMachine, StateMachineState } from "@sorrir/framework";
import { BarrierEventTypes } from "./events";
import {
  createStatemachineComponent,
  AtomicComponent,
} from "@sorrir/framework";

enum States {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
}

export enum BarrierPorts {
  FROM_DSB = "FROM_DSB",
}

const sm: StateMachine<States, undefined, BarrierEventTypes, BarrierPorts> = {
  transitions: [
    {
      sourceState: States.CLOSED,
      targetState: States.OPEN,
      event: ["oneway", BarrierEventTypes.OPEN, BarrierPorts.FROM_DSB],
    },
    {
      sourceState: States.OPEN,
      targetState: States.CLOSED,
      event: ["oneway", BarrierEventTypes.CLOSE, BarrierPorts.FROM_DSB],
    },
  ],
};

export const barrier: AtomicComponent<BarrierEventTypes, BarrierPorts> =
  createStatemachineComponent(
    [
      {
        name: BarrierPorts.FROM_DSB,
        eventTypes: Object.values(BarrierEventTypes),
        direction: "in",
      },
    ],
    sm,
    "barrier"
  );

export const barrierStartState: StateMachineState<
  any,
  any,
  undefined,
  undefined
> = {
  state: { fsm: States.CLOSED, my: undefined },
  events: [],
  tsType: "State",
};
