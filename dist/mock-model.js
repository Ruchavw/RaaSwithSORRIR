"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.example_config = void 0;
const sensor_1 = require("./components/sensor");
const fault_handler_1 = require("./components/fault-handler");
const core_app_1 = require("./core-app"); // ✅ NEW: simulate unaffected app logic
// ✅ For dashboard logging
const logs = [];
// Generic state machine runner
function runTransition(fsm, state, incomingEvents = []) {
    const raisedEvents = [];
    const transition = fsm.transitions.find((t) => {
        if (t.sourceState !== state.state.fsm)
            return false;
        if (t.event) {
            const [ec, etype, eport] = t.event;
            return incomingEvents.some((e) => e.eventClass === ec && e.type === etype && e.port === eport);
        }
        if (t.condition) {
            return t.condition(state.state.my);
        }
        return true;
    });
    const newMy = (transition === null || transition === void 0 ? void 0 : transition.action)
        ? transition.action(state.state.my, (e) => raisedEvents.push(e))
        : state.state.my;
    return {
        newState: {
            state: {
                fsm: transition ? transition.targetState : state.state.fsm,
                my: newMy,
            },
            events: [],
            tsType: "State",
        },
        raisedEvents,
    };
}
exports.example_config = {
    run: () => __awaiter(void 0, void 0, void 0, function* () {
        let sensorState = sensor_1.sensorStartState;
        let faultHandlerState = fault_handler_1.faultHandlerStartState;
        for (let i = 0; i < 5; i++) {
            console.log(`\n🔁 Cycle ${i + 1}`);
            // Run core app logic
            (0, core_app_1.coreApplicationLogic)();
            if (i === 2) {
                console.log("⚠️ Injecting fault in sensor (my = -1)");
                sensorState.state.my = -1;
            }
            const sensorResult = runTransition(sensor_1.sm, sensorState);
            sensorState = sensorResult.newState;
            // ✅ Map Sensor FAULT to FaultHandler FAULT
            const faultEvents = sensorResult.raisedEvents
                .filter((e) => e.type === sensor_1.SensorEventTypes.FAULT)
                .map((e) => ({
                type: fault_handler_1.FaultHandlerEventTypes.FAULT,
                port: fault_handler_1.FaultHandlerPorts.FROM_SENSOR,
                eventClass: e.eventClass,
            }));
            const faultResult = runTransition(fault_handler_1.sm, faultHandlerState, faultEvents);
            faultHandlerState = faultResult.newState;
            // ✅ Simulate main unaffected application logic
            (0, core_app_1.coreApplicationLogic)();
            console.log(`📡 Sensor FSM: ${sensorState.state.fsm}`);
            console.log(`🛡️ FaultHandler FSM: ${faultHandlerState.state.fsm}`);
            // ✅ Save to logs for dashboard
            logs.push({
                cycle: i + 1,
                sensorState: sensorState.state.fsm,
                faultHandlerState: faultHandlerState.state.fsm,
                raisedEvents: sensorResult.raisedEvents.map((e) => e.type),
            });
        }
        // ✅ Output logs as table
        console.log("\n📋 Final Transition Log:");
        console.table(logs);
        console.log("\n✅ Simulation finished.");
    }),
};
// Run directly
if (require.main === module) {
    console.log("🚀 Starting mock-model simulation...");
    exports.example_config.run();
}
//# sourceMappingURL=mock-model.js.map