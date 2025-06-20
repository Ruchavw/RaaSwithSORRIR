import { AtomicComponent, StateMachine, StateMachineState } from "@sorrir/framework";
export declare enum FaultHandlerEventTypes {
    FAULT = "FAULT",
    OK = "OK"
}
export declare enum FaultHandlerPorts {
    FROM_SENSOR = "FROM_SENSOR"
}
declare enum FHStates {
    MONITORING = "MONITORING",
    FAULTED = "FAULTED"
}
type abstractState = {
    faultCount: number;
};
declare const sm: StateMachine<FHStates, abstractState, FaultHandlerEventTypes, FaultHandlerPorts>;
export declare const faultHandler: AtomicComponent<FaultHandlerEventTypes, FaultHandlerPorts>;
export declare const faultHandlerStartState: StateMachineState<FHStates, abstractState, FaultHandlerEventTypes, FaultHandlerPorts>;
export { sm };
