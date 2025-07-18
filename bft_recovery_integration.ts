// src/bft_recovery_integration.ts

class BFTRecovery {
  private faultUrl = "http://localhost:3000/simulate";
  private recoveryUrl = "http://localhost:3000/recover";

  private async postWithTimeout(
    url: string,
    timeoutMs: number
  ): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
      });
      return await response.text();
    } catch (error) {
      console.error(`Request to ${url} failed:`, error);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async simulateFault(): Promise<void> {
    console.log("🚨 Simulating fault...");
    const result = await this.postWithTimeout(this.faultUrl, 2000);
    if (result) console.log("⚡ Fault response:", result);
  }

  public async triggerRecovery(): Promise<void> {
    console.log("🛠️ Triggering recovery...");
    const result = await this.postWithTimeout(this.recoveryUrl, 10000);
    if (result) console.log("✅ Recovery response:", result);
  }

  public async runWorkflow(): Promise<void> {
    console.log("🧪 Starting BFT Recovery Workflow...");
    const start = Date.now();

    await this.simulateFault();
    await this.triggerRecovery();

    const duration = Date.now() - start;
    console.log(`🎯 Workflow completed in ${duration} ms`);
  }
}

// Direct execution
if (require.main === module) {
  const recovery = new BFTRecovery();
  recovery.runWorkflow().catch(console.error);
}

export { BFTRecovery };
