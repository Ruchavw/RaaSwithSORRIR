"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEventTypes = exports.DSBEventTypes = exports.BarrierEventTypes = exports.SensorEventTypes = void 0;
var SensorEventTypes;
(function (SensorEventTypes) {
    SensorEventTypes["DETECTION"] = "DETECTION";
    SensorEventTypes["NOTHING"] = "NOTHING";
    SensorEventTypes["FAULT"] = "FAULT";
})(SensorEventTypes || (exports.SensorEventTypes = SensorEventTypes = {}));
var BarrierEventTypes;
(function (BarrierEventTypes) {
    BarrierEventTypes["OPEN"] = "OPEN";
    BarrierEventTypes["CLOSE"] = "CLOSE";
})(BarrierEventTypes || (exports.BarrierEventTypes = BarrierEventTypes = {}));
var DSBEventTypes;
(function (DSBEventTypes) {
    DSBEventTypes["ALERT"] = "ALERT";
    DSBEventTypes["OK"] = "OK";
    DSBEventTypes["SELECTION_MADE"] = "SELECTION_MADE";
})(DSBEventTypes || (exports.DSBEventTypes = DSBEventTypes = {}));
var UserEventTypes;
(function (UserEventTypes) {
    UserEventTypes["REQUEST_ENTRY"] = "REQUEST_ENTRY";
    UserEventTypes["EXIT"] = "EXIT";
    UserEventTypes["ASK_SELECTION"] = "ASK_SELECTION";
})(UserEventTypes || (exports.UserEventTypes = UserEventTypes = {}));
//# sourceMappingURL=events.js.map