import { StateMachine, StateMachineState, AtomicComponent } from "@sorrir/framework";
export declare enum SensorEventTypes {
    DETECTION = "DETECTION",
    NOTHING = "NOTHING",
    FAULT = "FAULT"
}
export declare enum SensorPorts {
    TO_DSB = "TO_DSB"
}
export declare enum States {
    CAR = "CAR",
    NO_CAR = "NO_CAR",
    FAULTY = "FAULTY"
}
type abstractState = number;
export declare const sm: StateMachine<States, abstractState, SensorEventTypes, SensorPorts>;
export declare const sensor: AtomicComponent<SensorEventTypes, SensorPorts>;
export declare const sensorStartState: StateMachineState<States, abstractState, SensorEventTypes, SensorPorts>;
export {};
