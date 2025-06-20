import { example_config } from "./mock-model";

console.info("Starting the SORRIR example-1-mvp simulation...");

export async function simulateModel(model: any) {
  console.log(`[Simulator] Simulating model: ${model.name}`);
  await model.run();
}

simulateModel(example_config).then(() => {
  console.info("Simulation finished.");
});
