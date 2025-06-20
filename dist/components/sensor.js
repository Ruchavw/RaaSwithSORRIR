"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensorStartState = exports.sensor = exports.sm = exports.States = exports.SensorPorts = exports.SensorEventTypes = void 0;
const framework_1 = require("@sorrir/framework");
// Event types the sensor can emit
var SensorEventTypes;
(function (SensorEventTypes) {
    SensorEventTypes["DETECTION"] = "DETECTION";
    SensorEventTypes["NOTHING"] = "NOTHING";
    SensorEventTypes["FAULT"] = "FAULT";
})(SensorEventTypes || (exports.SensorEventTypes = SensorEventTypes = {}));
// Ports the sensor can communicate on
var SensorPorts;
(function (SensorPorts) {
    SensorPorts["TO_DSB"] = "TO_DSB";
})(SensorPorts || (exports.SensorPorts = SensorPorts = {}));
// FSM states for the sensor
var States;
(function (States) {
    States["CAR"] = "CAR";
    States["NO_CAR"] = "NO_CAR";
    States["FAULTY"] = "FAULTY";
})(States || (exports.States = States = {}));
// ✅ State machine definition
exports.sm = {
    transitions: [
        //⚠️ Fault transition from NO_CAR
        {
            sourceState: States.NO_CAR,
            targetState: States.FAULTY,
            condition: (tick) => tick === -1,
            action: (tick, raiseEvent) => {
                raiseEvent({ type: SensorEventTypes.FAULT, port: SensorPorts.TO_DSB, eventClass: "oneway" });
                return tick;
            },
        },
        // ⚠️ Fault transition from CAR
        {
            sourceState: States.CAR,
            targetState: States.FAULTY,
            condition: (tick) => tick === -1,
            action: (tick, raiseEvent) => {
                raiseEvent({ type: SensorEventTypes.FAULT, port: SensorPorts.TO_DSB, eventClass: "oneway" });
                return tick;
            },
        },
        // ✅ Normal detection (CAR arrives)
        {
            sourceState: States.NO_CAR,
            targetState: States.CAR,
            action: (tick, raiseEvent) => {
                raiseEvent({ type: SensorEventTypes.DETECTION, port: SensorPorts.TO_DSB, eventClass: "oneway" });
                return tick + 1;
            },
        },
        // ⏱ Stay in CAR up to 3 ticks
        {
            sourceState: States.CAR,
            targetState: States.CAR,
            condition: (tick) => tick <= 3,
            action: (tick) => tick + 1,
        },
        // ⬅️ Reset to NO_CAR after CAR state ends
        {
            sourceState: States.CAR,
            targetState: States.NO_CAR,
            condition: (tick) => tick > 3,
            action: (tick, raiseEvent) => {
                raiseEvent({ type: SensorEventTypes.NOTHING, port: SensorPorts.TO_DSB, eventClass: "oneway" });
                return 0;
            },
        },
    ],
};
// ✅ Component creation
exports.sensor = (0, framework_1.createStatemachineComponent)([
    {
        name: SensorPorts.TO_DSB,
        eventTypes: Object.values(SensorEventTypes),
        direction: "out",
    },
], exports.sm, "sensor");
// ✅ Start state
exports.sensorStartState = {
    state: { fsm: States.NO_CAR, my: 0 },
    events: [],
    tsType: "State",
};
//# sourceMappingURL=sensor.js.map