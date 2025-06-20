import { StateMachineState } from "@sorrir/framework";
import { UserEventTypes, DSBEventTypes } from "./events";
import { AtomicComponent } from "@sorrir/framework";
export declare enum UserPorts {
    TO_DSB = "TO_DSB",
    FROM_DSB = "FROM_DSB"
}
export declare const user: AtomicComponent<UserEventTypes | DSBEventTypes, UserPorts>;
export declare const userStartState: StateMachineState<any, any, undefined, undefined>;
