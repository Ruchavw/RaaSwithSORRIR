import { AtomicComponent, StateMachineState } from "@sorrir/framework";
export declare enum FaultHandlerPorts {
    FROM_SENSOR = "FROM_SENSOR"
}
export declare enum FaultHandlerEventTypes {
    FAULT = "FAULT",
    DETECTION = "DETECTION",
    NOTHING = "NOTHING"
}
declare enum FHStates {
    MONITORING = "MONITORING"
}
type dummy = number;
export declare const faultHandler: AtomicComponent<FaultHandlerEventTypes, FaultHandlerPorts, unknown>;
export declare const faultHandlerStartState: StateMachineState<FHStates, dummy, FaultHandlerEventTypes, FaultHandlerPorts>;
export {};
