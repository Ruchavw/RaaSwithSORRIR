"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSBStartState = exports.DSB = exports.DSBPorts = void 0;
const events_1 = require("./events");
const framework_1 = require("@sorrir/framework");
var States;
(function (States) {
    States["IDLE"] = "IDLE";
    States["SHOW_SELECTION"] = "SHOW_SELECTION";
    States["WAITING_FOR_CAR_PASSED"] = "WAITING_FOR_CAR_PASSED";
})(States || (States = {}));
var DSBPorts;
(function (DSBPorts) {
    DSBPorts["FROM_SENSOR"] = "FROM_SENSOR";
    DSBPorts["TO_BARRIER"] = "TO_BARRIER";
    DSBPorts["FROM_USER"] = "FROM_USER";
    DSBPorts["TO_USER"] = "TO_USER";
})(DSBPorts || (exports.DSBPorts = DSBPorts = {}));
const sm = {
    transitions: [
        {
            sourceState: States.IDLE,
            targetState: States.SHOW_SELECTION,
            event: ["oneway", events_1.SensorEventTypes.DETECTION, DSBPorts.FROM_SENSOR],
            action: (myState, raiseEvent) => {
                raiseEvent({
                    eventClass: "oneway",
                    type: events_1.UserEventTypes.ASK_SELECTION,
                    port: DSBPorts.TO_USER,
                });
                return undefined;
            },
        },
        {
            sourceState: States.SHOW_SELECTION,
            targetState: States.WAITING_FOR_CAR_PASSED,
            event: ["oneway", events_1.DSBEventTypes.SELECTION_MADE, DSBPorts.FROM_USER],
            action: (myState, raiseEvent) => {
                raiseEvent({
                    eventClass: "oneway",
                    type: events_1.BarrierEventTypes.OPEN,
                    port: DSBPorts.TO_BARRIER,
                });
                return undefined;
            },
        },
        {
            sourceState: States.WAITING_FOR_CAR_PASSED,
            targetState: States.IDLE,
            event: ["oneway", events_1.SensorEventTypes.NOTHING, DSBPorts.FROM_SENSOR],
            action: (myState, raiseEvent) => {
                raiseEvent({
                    eventClass: "oneway",
                    type: events_1.BarrierEventTypes.CLOSE,
                    port: DSBPorts.TO_BARRIER,
                });
                return undefined;
            },
        },
    ],
};
exports.DSB = (0, framework_1.createStatemachineComponent)([
    {
        name: DSBPorts.FROM_SENSOR,
        eventTypes: Object.values(events_1.SensorEventTypes),
        direction: "in",
    },
    {
        name: DSBPorts.TO_BARRIER,
        eventTypes: Object.values(events_1.BarrierEventTypes),
        direction: "out",
    },
    {
        name: DSBPorts.FROM_USER,
        eventTypes: Object.values(events_1.DSBEventTypes),
        direction: "in",
    },
    {
        name: DSBPorts.TO_USER,
        eventTypes: Object.values(events_1.UserEventTypes),
        direction: "out",
    },
], sm, "DSB");
exports.DSBStartState = {
    state: { fsm: States.IDLE, my: undefined },
    events: [],
    tsType: "State",
};
//# sourceMappingURL=DSB.js.map