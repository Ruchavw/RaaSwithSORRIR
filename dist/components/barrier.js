"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.barrierStartState = exports.barrier = exports.BarrierPorts = void 0;
const events_1 = require("./events");
const framework_1 = require("@sorrir/framework");
var States;
(function (States) {
    States["CLOSED"] = "CLOSED";
    States["OPEN"] = "OPEN";
})(States || (States = {}));
var BarrierPorts;
(function (BarrierPorts) {
    BarrierPorts["FROM_DSB"] = "FROM_DSB";
})(BarrierPorts || (exports.BarrierPorts = BarrierPorts = {}));
const sm = {
    transitions: [
        {
            sourceState: States.CLOSED,
            targetState: States.OPEN,
            event: ["oneway", events_1.BarrierEventTypes.OPEN, BarrierPorts.FROM_DSB],
        },
        {
            sourceState: States.OPEN,
            targetState: States.CLOSED,
            event: ["oneway", events_1.BarrierEventTypes.CLOSE, BarrierPorts.FROM_DSB],
        },
    ],
};
exports.barrier = (0, framework_1.createStatemachineComponent)([
    {
        name: BarrierPorts.FROM_DSB,
        eventTypes: Object.values(events_1.BarrierEventTypes),
        direction: "in",
    },
], sm, "barrier");
exports.barrierStartState = {
    state: { fsm: States.CLOSED, my: undefined },
    events: [],
    tsType: "State",
};
//# sourceMappingURL=barrier.js.map