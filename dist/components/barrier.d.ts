import { StateMachineState } from "@sorrir/framework";
import { BarrierEventTypes } from "./events";
import { AtomicComponent } from "@sorrir/framework";
export declare enum BarrierPorts {
    FROM_DSB = "FROM_DSB"
}
export declare const barrier: AtomicComponent<BarrierEventTypes, BarrierPorts>;
export declare const barrierStartState: StateMachineState<any, any, undefined, undefined>;
