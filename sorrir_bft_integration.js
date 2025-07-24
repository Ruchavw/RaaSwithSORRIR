"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorrirBFTRecoveryOrchestrator = exports.bftRecoveryFSM = exports.bftRecoveryStartState = void 0;
// sorrir_bft_integration.ts
var logMetrics = require('./utils/metricsLogger').logMetrics;
var bft_recovery_integration_1 = require("./bft_recovery_integration");
var uuid_1 = require("uuid");
var fs = require("fs");
// SLO Deadline for recovery (in ms)
var SLO_DEADLINE = 2000;
exports.bftRecoveryStartState = {
    state: {
        fsm: "MONITORING",
        my: {
            currentPhase: "MONITORING",
            lastDecision: null,
            recoveryAttempts: 0,
            lastRecoveryTime: 0,
            bftConsensusActive: false,
            targetContainer: "faulty-app",
        },
    },
    events: [],
    tsType: "State",
};
exports.bftRecoveryFSM = {
    transitions: [
        {
            sourceState: "MONITORING",
            event: ["oneway", "FAULT_DETECTED", undefined],
            targetState: "ANALYZING",
            action: function (state, raiseEvent, incomingEvent) {
                var _a;
                return (__assign(__assign({}, state), { currentPhase: "ANALYZING", targetContainer: ((_a = incomingEvent === null || incomingEvent === void 0 ? void 0 : incomingEvent.payload) === null || _a === void 0 ? void 0 : _a.containerName) || "faulty-app" }));
            },
        },
        {
            sourceState: "ANALYZING",
            event: ["oneway", "BFT_CONSENSUS_COMPLETE", undefined],
            targetState: "RECOVERING",
            action: function (state, raiseEvent, incomingEvent) {
                var _a;
                return (__assign(__assign({}, state), { currentPhase: "RECOVERING", lastDecision: ((_a = incomingEvent === null || incomingEvent === void 0 ? void 0 : incomingEvent.payload) === null || _a === void 0 ? void 0 : _a.decision) || "RECOVER", bftConsensusActive: true, recoveryAttempts: state.recoveryAttempts + 1 }));
            },
        },
        {
            sourceState: "RECOVERING",
            event: ["oneway", "RECOVERY_COMPLETE", undefined],
            targetState: "VERIFYING",
            action: function (state) { return (__assign(__assign({}, state), { currentPhase: "VERIFYING", lastRecoveryTime: Date.now() })); },
        },
        {
            sourceState: "VERIFYING",
            event: ["oneway", "VERIFICATION_SUCCESS", undefined],
            targetState: "COMPLETE",
            action: function (state, raiseEvent) {
                raiseEvent({
                    id: (0, uuid_1.v4)(),
                    eventClass: "oneway",
                    type: "RECOVERY_SUCCESS",
                    port: "recovery-complete",
                });
                return __assign(__assign({}, state), { currentPhase: "COMPLETE", bftConsensusActive: false });
            },
        },
        {
            sourceState: "VERIFYING",
            event: ["oneway", "VERIFICATION_FAILED", undefined],
            targetState: "ANALYZING",
            action: function (state) { return (__assign(__assign({}, state), { currentPhase: "ANALYZING", bftConsensusActive: false })); },
        },
        {
            sourceState: "COMPLETE",
            event: ["oneway", "RESET_MONITOR", undefined],
            targetState: "MONITORING",
            action: function (state) { return (__assign(__assign({}, state), { currentPhase: "MONITORING", lastDecision: null, bftConsensusActive: false })); },
        },
    ],
};
var SorrirBFTRecoveryOrchestrator = /** @class */ (function (_super) {
    __extends(SorrirBFTRecoveryOrchestrator, _super);
    function SorrirBFTRecoveryOrchestrator() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.sorrirState = exports.bftRecoveryStartState;
        _this.eventQueue = [];
        return _this;
    }
    SorrirBFTRecoveryOrchestrator.prototype.runSorrirTransition = function (incomingEvent) {
        var _a;
        var _this = this;
        var raisedEvents = [];
        var transition = exports.bftRecoveryFSM.transitions.find(function (t) {
            return t.sourceState === _this.sorrirState.state.fsm &&
                (!t.event ||
                    (t.event[0] === (incomingEvent === null || incomingEvent === void 0 ? void 0 : incomingEvent.eventClass) &&
                        t.event[1] === (incomingEvent === null || incomingEvent === void 0 ? void 0 : incomingEvent.type) &&
                        t.event[2] === (incomingEvent === null || incomingEvent === void 0 ? void 0 : incomingEvent.port)));
        });
        if (transition) {
            var newMy = transition.action
                ? transition.action(this.sorrirState.state.my, function (e) { return raisedEvents.push(e); }, incomingEvent)
                : this.sorrirState.state.my;
            this.sorrirState = {
                state: {
                    fsm: transition.targetState,
                    my: newMy,
                },
                events: raisedEvents,
                tsType: "State",
            };
            (_a = this.eventQueue).push.apply(_a, raisedEvents);
        }
    };
    SorrirBFTRecoveryOrchestrator.prototype.invokeSorrirBFTRecovery = function () {
        return __awaiter(this, arguments, void 0, function (container) {
            var taskId, detectTime, health, decision, isHealthy, recoverTime, decisionTime, responseTime, sloViolated, memoryUsed, uptimeSeconds, cpuUsagePercent, energy, error_1;
            if (container === void 0) { container = "faulty-app"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        taskId = "sorrir-bft-".concat(Date.now());
                        detectTime = Date.now();
                        this.runSorrirTransition({
                            id: (0, uuid_1.v4)(),
                            eventClass: "oneway",
                            type: "FAULT_DETECTED",
                            port: undefined,
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.checkContainerHealth(container)];
                    case 2:
                        health = _a.sent();
                        return [4 /*yield*/, this.getBFTDecision(health)];
                    case 3:
                        decision = _a.sent();
                        this.runSorrirTransition({
                            id: (0, uuid_1.v4)(),
                            eventClass: "oneway",
                            type: "BFT_CONSENSUS_COMPLETE",
                            port: undefined,
                        });
                        return [4 /*yield*/, this.executeRecovery(decision, container)];
                    case 4:
                        _a.sent();
                        this.runSorrirTransition({
                            id: (0, uuid_1.v4)(),
                            eventClass: "oneway",
                            type: "RECOVERY_COMPLETE",
                            port: undefined,
                        });
                        return [4 /*yield*/, this.testFaultyApp()];
                    case 5:
                        isHealthy = (_a.sent()).isHealthy;
                        this.runSorrirTransition({
                            id: (0, uuid_1.v4)(),
                            eventClass: "oneway",
                            type: isHealthy ? "VERIFICATION_SUCCESS" : "VERIFICATION_FAILED",
                            port: undefined,
                        });
                        recoverTime = Date.now();
                        decisionTime = recoverTime - detectTime;
                        responseTime = decisionTime;
                        sloViolated = responseTime > SLO_DEADLINE ? 1 : 0;
                        memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;
                        uptimeSeconds = process.uptime();
                        cpuUsagePercent = 25;
                        energy = cpuUsagePercent * uptimeSeconds * 0.000277;
                        console.log("📊 Calling logMetrics with:", {
                            taskId: taskId,
                            responseTime: responseTime,
                            sloViolated: sloViolated,
                            decisionTime: decisionTime,
                            memoryUsed: memoryUsed.toFixed(2),
                            energy: energy.toFixed(4),
                        });
                        logMetrics({
                            taskId: taskId,
                            responseTime: responseTime,
                            sloViolated: sloViolated,
                            decisionTime: decisionTime,
                            memoryUsed: memoryUsed.toFixed(2),
                            energy: energy.toFixed(4),
                        });
                        return [4 /*yield*/, this.notifyCloudCoordinator(decision, container, { healthy: isHealthy })];
                    case 6:
                        _a.sent();
                        this.logSorrirState();
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Recovery error:", error_1);
                        this.runSorrirTransition({
                            id: (0, uuid_1.v4)(),
                            eventClass: "oneway",
                            type: "VERIFICATION_FAILED",
                            port: undefined,
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.logSorrirState = function () {
        var entry = {
            timestamp: Date.now(),
            state: this.sorrirState.state.fsm,
            details: this.sorrirState.state.my,
        };
        var path = "./data/outputs/sorrir_bft_state.json";
        var current = fs.existsSync(path)
            ? JSON.parse(fs.readFileSync(path, "utf8"))
            : [];
        current.push(entry);
        fs.writeFileSync(path, JSON.stringify(current, null, 2));
    };
    SorrirBFTRecoveryOrchestrator.prototype.resetToMonitoring = function () {
        this.runSorrirTransition({
            id: (0, uuid_1.v4)(),
            eventClass: "oneway",
            type: "RESET_MONITOR",
            port: undefined,
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.getSorrirState = function () {
        return this.sorrirState;
    };
    SorrirBFTRecoveryOrchestrator.prototype.checkContainerHealth = function (container) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "healthy"]; // stubbed
            });
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.getBFTDecision = function (state) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "RECOVER"]; // stubbed
            });
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.executeRecovery = function (decision, target) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Executing recovery for ".concat(target, " with decision ").concat(decision));
                return [2 /*return*/];
            });
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.testFaultyApp = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { isHealthy: true }]; // stubbed
            });
        });
    };
    SorrirBFTRecoveryOrchestrator.prototype.notifyCloudCoordinator = function (decision, container, result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log("Notify cloud: ".concat(container, " decision=").concat(decision, " result=").concat(JSON.stringify(result)));
                return [2 /*return*/];
            });
        });
    };
    return SorrirBFTRecoveryOrchestrator;
}(bft_recovery_integration_1.BFTRecovery));
exports.SorrirBFTRecoveryOrchestrator = SorrirBFTRecoveryOrchestrator;
if (require.main === module) {
    var runner = new SorrirBFTRecoveryOrchestrator();
    runner.invokeSorrirBFTRecovery;
}
