"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faultHandlerStartState = exports.faultHandler = exports.FaultHandlerEventTypes = exports.FaultHandlerPorts = void 0;
const framework_1 = require("@sorrir/framework");
var FaultHandlerPorts;
(function (FaultHandlerPorts) {
    FaultHandlerPorts["FROM_SENSOR"] = "FROM_SENSOR";
})(FaultHandlerPorts || (exports.FaultHandlerPorts = FaultHandlerPorts = {}));
var FaultHandlerEventTypes;
(function (FaultHandlerEventTypes) {
    FaultHandlerEventTypes["FAULT"] = "FAULT";
    FaultHandlerEventTypes["DETECTION"] = "DETECTION";
    FaultHandlerEventTypes["NOTHING"] = "NOTHING";
})(FaultHandlerEventTypes || (exports.FaultHandlerEventTypes = FaultHandlerEventTypes = {}));
var FHStates;
(function (FHStates) {
    FHStates["MONITORING"] = "MONITORING";
})(FHStates || (FHStates = {}));
const sm = {
    transitions: [
        {
            sourceState: FHStates.MONITORING,
            targetState: FHStates.MONITORING,
            condition: () => true,
            action: (_, __, event) => {
                if ((event === null || event === void 0 ? void 0 : event.type) === FaultHandlerEventTypes.FAULT) {
                    console.log("⚠️ Fault Detected by FaultHandler");
                }
                return 0;
            },
        },
    ],
};
exports.faultHandler = (0, framework_1.createStatemachineComponent)([
    {
        name: FaultHandlerPorts.FROM_SENSOR,
        eventTypes: Object.values(FaultHandlerEventTypes),
        direction: "in",
    },
], sm, "fault-handler");
exports.faultHandlerStartState = { state: { fsm: FHStates.MONITORING, my: 0 }, events: [], tsType: "State" };
//# sourceMappingURL=fault-handler.js.map