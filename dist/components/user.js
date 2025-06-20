"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStartState = exports.user = exports.UserPorts = void 0;
const events_1 = require("./events");
const framework_1 = require("@sorrir/framework");
var States;
(function (States) {
    States["WAITING"] = "WAITING";
})(States || (States = {}));
var UserPorts;
(function (UserPorts) {
    UserPorts["TO_DSB"] = "TO_DSB";
    UserPorts["FROM_DSB"] = "FROM_DSB";
})(UserPorts || (exports.UserPorts = UserPorts = {}));
const sm = {
    transitions: [
        {
            sourceState: States.WAITING,
            targetState: States.WAITING,
            event: ["oneway", events_1.UserEventTypes.ASK_SELECTION, UserPorts.FROM_DSB],
            action: (_, raiseEvent) => {
                const event = {
                    type: events_1.DSBEventTypes.SELECTION_MADE,
                    port: UserPorts.TO_DSB,
                    eventClass: "oneway",
                };
                raiseEvent(event);
                return _;
            },
        },
    ],
};
exports.user = (0, framework_1.createStatemachineComponent)([
    {
        name: UserPorts.FROM_DSB,
        eventTypes: Object.values(events_1.UserEventTypes),
        direction: "in",
    },
    {
        name: UserPorts.TO_DSB,
        eventTypes: Object.values(events_1.DSBEventTypes),
        direction: "out",
    },
], sm, "user");
exports.userStartState = {
    state: { fsm: States.WAITING, my: undefined },
    events: [],
    tsType: "State",
};
//# sourceMappingURL=user.js.map