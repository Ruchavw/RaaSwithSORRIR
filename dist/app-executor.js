"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const framework_1 = require("@sorrir/framework");
const framework_2 = require("@sorrir/framework");
const sorrirLogger = __importStar(require("@sorrir/sorrir-logging"));
const framework_3 = require("@sorrir/framework");
sorrirLogger.configLogger({ area: "execution" });
// Be polite and say hello
console.log("Hello Sorrir!");
const runConfig = (0, framework_3.setup)();
const appConfig = (0, framework_1.getAppConfig)();
/*
HOW TO RUN
from cli:
npm run startExecutor -- --to-execute <unitName> --env <production | development>
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        if (runConfig.toExecute &&
            runConfig.toExecute !== "" &&
            runConfig.hostConfiguration.hasOwnProperty(runConfig.toExecute)) {
            yield (0, framework_2.executeRunConfiguration)(runConfig);
        }
        else if (runConfig.toExecute !== "" &&
            !runConfig.hostConfiguration.hasOwnProperty(runConfig.toExecute)) {
            console.log(`unknown host "${runConfig.toExecute}`);
        }
        else {
            console.log("no container defined to execute");
        }
    });
}
main().catch((e) => console.log(e));
/*
SENSOR simulation:
curl -X POST -H "Content-Type: application/json"  -d '{"event": "DETECTION"}'  http://localhost:1235/b/DSB/FROM_SENSOR
curl -X POST -H "Content-Type: application/json"  -d '{"event": "NOTHING"}'  http://localhost:1235/b/DSB/FROM_SENSOR
*/
//# sourceMappingURL=app-executor.js.map