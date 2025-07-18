declare class BFTRecoveryOrchestrator {
    private bftJavaPath;
    constructor(bftJavaPath: string);
    simulateFault(): Promise<void>;
    triggerRecovery(): Promise<void>;
    run(): Promise<void>;
}
export { BFTRecoveryOrchestrator };
