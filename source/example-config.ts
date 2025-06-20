export const example_config = {
  name: "mock-model",
  async run() {
    console.log("Mock simulation is running...");
    // simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};
