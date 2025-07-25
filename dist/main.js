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
exports.simulateModel = simulateModel;
const mock_model_1 = require("./mock-model");
console.info("Starting the SORRIR example-1-mvp simulation...");
function simulateModel(model) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Simulator] Simulating model: ${model.name}`);
        yield model.run();
    });
}
simulateModel(mock_model_1.example_config).then(() => {
    console.info("Simulation finished.");
});
//# sourceMappingURL=main.js.map