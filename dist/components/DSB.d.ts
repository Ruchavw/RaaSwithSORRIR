import { StateMachineState } from "@sorrir/framework";
import { BarrierEventTypes, SensorEventTypes, DSBEventTypes, UserEventTypes } from "./events";
import { AtomicComponent } from "@sorrir/framework";
export declare enum DSBPorts {
    FROM_SENSOR = "FROM_SENSOR",
    TO_BARRIER = "TO_BARRIER",
    FROM_USER = "FROM_USER",
    TO_USER = "TO_USER"
}
export declare const DSB: AtomicComponent<BarrierEventTypes | SensorEventTypes | DSBEventTypes | UserEventTypes, DSBPorts>;
export declare const DSBStartState: StateMachineState<any, any, undefined, undefined>;
