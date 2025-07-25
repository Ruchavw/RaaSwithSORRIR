"use strict";
// src/bft_recovery_integration.ts
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
exports.BFTRecovery = void 0;
var BFTRecovery = /** @class */ (function () {
    function BFTRecovery() {
        this.faultUrl = "http://localhost:3000/simulate";
        this.recoveryUrl = "http://localhost:3000/recover";
    }
    BFTRecovery.prototype.postWithTimeout = function (url, timeoutMs) {
        return __awaiter(this, void 0, void 0, function () {
            var controller, timeout, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        controller = new AbortController();
                        timeout = setTimeout(function () { return controller.abort(); }, timeoutMs);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch(url, {
                                method: "POST",
                                signal: controller.signal,
                            })];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.text()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_1 = _a.sent();
                        console.error("Request to ".concat(url, " failed:"), error_1);
                        return [2 /*return*/, null];
                    case 5:
                        clearTimeout(timeout);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BFTRecovery.prototype.simulateFault = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("🚨 Simulating fault...");
                        return [4 /*yield*/, this.postWithTimeout(this.faultUrl, 2000)];
                    case 1:
                        result = _a.sent();
                        if (result)
                            console.log("⚡ Fault response:", result);
                        return [2 /*return*/];
                }
            });
        });
    };
    BFTRecovery.prototype.triggerRecovery = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("🛠️ Triggering recovery...");
                        return [4 /*yield*/, this.postWithTimeout(this.recoveryUrl, 10000)];
                    case 1:
                        result = _a.sent();
                        if (result)
                            console.log("✅ Recovery response:", result);
                        return [2 /*return*/];
                }
            });
        });
    };
    BFTRecovery.prototype.runWorkflow = function () {
        return __awaiter(this, void 0, void 0, function () {
            var start, duration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("🧪 Starting BFT Recovery Workflow...");
                        start = Date.now();
                        return [4 /*yield*/, this.simulateFault()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.triggerRecovery()];
                    case 2:
                        _a.sent();
                        duration = Date.now() - start;
                        console.log("\uD83C\uDFAF Workflow completed in ".concat(duration, " ms"));
                        return [2 /*return*/];
                }
            });
        });
    };
    return BFTRecovery;
}());
exports.BFTRecovery = BFTRecovery;
// Direct execution
if (require.main === module) {
    var recovery = new BFTRecovery();
    recovery.runWorkflow().catch(console.error);
}
