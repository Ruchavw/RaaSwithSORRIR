export async function simulateModel(model: any) {
  console.log(`[Simulator] Simulating model: ${model.name}`);
  await model.run();
}
