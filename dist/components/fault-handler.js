"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sm = exports.faultHandlerStartState = exports.faultHandler = exports.FaultHandlerPorts = exports.FaultHandlerEventTypes = void 0;
const framework_1 = require("@sorrir/framework");
// Define fault handler event types
var FaultHandlerEventTypes;
(function (FaultHandlerEventTypes) {
    FaultHandlerEventTypes["FAULT"] = "FAULT";
    FaultHandlerEventTypes["OK"] = "OK";
})(FaultHandlerEventTypes || (exports.FaultHandlerEventTypes = FaultHandlerEventTypes = {}));
// Define the ports for the fault handler
var FaultHandlerPorts;
(function (FaultHandlerPorts) {
    FaultHandlerPorts["FROM_SENSOR"] = "FROM_SENSOR";
})(FaultHandlerPorts || (exports.FaultHandlerPorts = FaultHandlerPorts = {}));
// FSM states
var FHStates;
(function (FHStates) {
    FHStates["MONITORING"] = "MONITORING";
    FHStates["FAULTED"] = "FAULTED";
})(FHStates || (FHStates = {}));
// ✅ State machine with auto-recovery logic
const sm = {
    transitions: [
        {
            sourceState: FHStates.MONITORING,
            targetState: FHStates.FAULTED,
            event: ["oneway", FaultHandlerEventTypes.FAULT, FaultHandlerPorts.FROM_SENSOR],
            action: (state) => {
                console.warn("⚠️ FAULT DETECTED by Fault Handler!");
                return { faultCount: 0 };
            },
        },
        {
            sourceState: FHStates.FAULTED,
            targetState: FHStates.FAULTED,
            condition: (state) => state.faultCount < 1,
            action: (state) => {
                return { faultCount: state.faultCount + 1 };
            },
        },
        {
            sourceState: FHStates.FAULTED,
            targetState: FHStates.MONITORING,
            condition: (state) => state.faultCount >= 1,
            action: (state) => {
                console.log("✅ FAULT RESOLVED automatically.");
                return { faultCount: 0 };
            },
        },
    ],
};
exports.sm = sm;
// Create the atomic component
exports.faultHandler = (0, framework_1.createStatemachineComponent)([
    {
        name: FaultHandlerPorts.FROM_SENSOR,
        direction: "in",
        eventTypes: Object.values(FaultHandlerEventTypes),
    },
], sm, "fault-handler");
// Initial state
exports.faultHandlerStartState = {
    state: { fsm: FHStates.MONITORING, my: { faultCount: 0 } },
    events: [],
    tsType: "State",
};
//# sourceMappingURL=fault-handler.js.map