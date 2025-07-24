"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFTRecoveryOrchestrator = void 0;
// bft_recovery_integration.ts — Clean and Complete Integration
delete global.AbortSignal;
if (typeof globalThis.AbortSignal === 'undefined') {
    globalThis.AbortSignal = require('abort-controller').AbortSignal;
}
class BFTRecoveryOrchestrator {
    constructor(bftJavaPath) {
        this.bftJavaPath = bftJavaPath;
    }
    async simulateFault() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        try {
            const response = await fetch('http://localhost:3000/simulate', {
                method: 'POST',
                signal: controller.signal
            });
            const result = await response.text();
            console.log('⚡ Simulated fault:', result);
        }
        catch (err) {
            console.error('❌ Fault simulation failed:', err);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async triggerRecovery() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch('http://localhost:3000/recover', {
                method: 'POST',
                signal: controller.signal
            });
            const result = await response.text();
            console.log('✅ Recovery response:', result);
        }
        catch (err) {
            console.error('❌ Recovery failed:', err);
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async run() {
        console.log("🧪 Running BFT Recovery Workflow...");
        const startTime = Date.now();
        await this.simulateFault();
        await this.triggerRecovery();
        console.log(`🎯 Recovery completed in ${Date.now() - startTime} ms`);
    }
}
exports.BFTRecoveryOrchestrator = BFTRecoveryOrchestrator;
// Optional direct runner when this file is called via node/ts-node
if (require.main === module) {
    const orchestrator = new BFTRecoveryOrchestrator('./bft-smart/bin');
    orchestrator.run().catch(console.error);
}
//# sourceMappingURL=bft_recovery_integration.js.map