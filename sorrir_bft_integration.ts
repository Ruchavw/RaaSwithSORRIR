// sorrir_bft_integration.ts
const { logMetrics } = require('./utils/metricsLogger');
import { BFTRecovery } from "./bft_recovery_integration";
import { StateMachineState, OneWayEvent } from "@sorrir/framework";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

// SLO Deadline for recovery (in ms)
const SLO_DEADLINE = 2000;

type FSMPhase = "MONITORING" | "ANALYZING" | "RECOVERING" | "VERIFYING" | "COMPLETE";

export interface BFTRecoveryState {
  currentPhase: FSMPhase;
  lastDecision: "RECOVER" | "RESET" | "RESTART" | null;
  recoveryAttempts: number;
  lastRecoveryTime: number;
  bftConsensusActive: boolean;
  targetContainer: string;
}

export const bftRecoveryStartState: StateMachineState<
  BFTRecoveryState,
  any,
  any,
  any
> = {
  state: {
    fsm: "MONITORING" as unknown as BFTRecoveryState,
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

export const bftRecoveryFSM = {
  transitions: [
    {
      sourceState: "MONITORING",
      event: ["oneway", "FAULT_DETECTED", undefined],
      targetState: "ANALYZING",
      action: (state, raiseEvent, incomingEvent) => ({
        ...state,
        currentPhase: "ANALYZING",
        targetContainer: incomingEvent?.payload?.containerName || "faulty-app",
      }),
    },
    {
      sourceState: "ANALYZING",
      event: ["oneway", "BFT_CONSENSUS_COMPLETE", undefined],
      targetState: "RECOVERING",
      action: (state, raiseEvent, incomingEvent) => ({
        ...state,
        currentPhase: "RECOVERING",
        lastDecision: incomingEvent?.payload?.decision || "RECOVER",
        bftConsensusActive: true,
        recoveryAttempts: state.recoveryAttempts + 1,
      }),
    },
    {
      sourceState: "RECOVERING",
      event: ["oneway", "RECOVERY_COMPLETE", undefined],
      targetState: "VERIFYING",
      action: (state) => ({
        ...state,
        currentPhase: "VERIFYING",
        lastRecoveryTime: Date.now(),
      }),
    },
    {
      sourceState: "VERIFYING",
      event: ["oneway", "VERIFICATION_SUCCESS", undefined],
      targetState: "COMPLETE",
      action: (state, raiseEvent) => {
        raiseEvent({
          id: uuidv4(),
          eventClass: "oneway",
          type: "RECOVERY_SUCCESS",
          port: "recovery-complete",
        });
        return {
          ...state,
          currentPhase: "COMPLETE",
          bftConsensusActive: false,
        };
      },
    },
    {
      sourceState: "VERIFYING",
      event: ["oneway", "VERIFICATION_FAILED", undefined],
      targetState: "ANALYZING",
      action: (state) => ({
        ...state,
        currentPhase: "ANALYZING",
        bftConsensusActive: false,
      }),
    },
    {
      sourceState: "COMPLETE",
      event: ["oneway", "RESET_MONITOR", undefined],
      targetState: "MONITORING",
      action: (state) => ({
        ...state,
        currentPhase: "MONITORING",
        lastDecision: null,
        bftConsensusActive: false,
      }),
    },
  ],
};

export class SorrirBFTRecoveryOrchestrator extends BFTRecovery {
  private sorrirState = bftRecoveryStartState;
  private eventQueue: OneWayEvent<any, any>[] = [];

  private runSorrirTransition(incomingEvent?: OneWayEvent<any, any>) {
    const raisedEvents: OneWayEvent<any, any>[] = [];

    const transition = bftRecoveryFSM.transitions.find(
      (t) =>
        t.sourceState === (this.sorrirState.state.fsm as unknown as string) &&
        (!t.event ||
          (t.event[0] === incomingEvent?.eventClass &&
            t.event[1] === incomingEvent?.type &&
            t.event[2] === incomingEvent?.port))
    );

    if (transition) {
      const newMy = transition.action
        ? transition.action(this.sorrirState.state.my, (e) => raisedEvents.push(e), incomingEvent)
        : this.sorrirState.state.my;

      this.sorrirState = {
        state: {
          fsm: transition.targetState as unknown as BFTRecoveryState,
          my: newMy,
        },
        events: raisedEvents,
        tsType: "State",
      };

      this.eventQueue.push(...raisedEvents);
    }
  }

  async invokeSorrirBFTRecovery(container = "faulty-app"): Promise<void> {
    const taskId = `sorrir-bft-${Date.now()}`;
    const detectTime = Date.now();

    this.runSorrirTransition({
      id: uuidv4(),
      eventClass: "oneway",
      type: "FAULT_DETECTED",
      port: undefined,
    });

    try {
      const health = await this.checkContainerHealth(container);
      const decision = await this.getBFTDecision(health);

      this.runSorrirTransition({
        id: uuidv4(),
        eventClass: "oneway",
        type: "BFT_CONSENSUS_COMPLETE",
        port: undefined,
      });

      await this.executeRecovery(decision, container);

      this.runSorrirTransition({
        id: uuidv4(),
        eventClass: "oneway",
        type: "RECOVERY_COMPLETE",
        port: undefined,
      });

      const { isHealthy } = await this.testFaultyApp();

      this.runSorrirTransition({
        id: uuidv4(),
        eventClass: "oneway",
        type: isHealthy ? "VERIFICATION_SUCCESS" : "VERIFICATION_FAILED",
        port: undefined,
      });

      const recoverTime = Date.now();
      const decisionTime = recoverTime - detectTime;
      const responseTime = decisionTime;
      const sloViolated = responseTime > SLO_DEADLINE ? 1 : 0;
      const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;
      const uptimeSeconds = process.uptime();
      const cpuUsagePercent = 25; // Approximate value—adjust if dynamic
      const energy = cpuUsagePercent * uptimeSeconds * 0.000277;
      console.log("📊 Calling logMetrics with:", {
  	taskId,
  	responseTime,
  	sloViolated,
  	decisionTime,
  	memoryUsed: memoryUsed.toFixed(2),
  	energy: energy.toFixed(4),
      });
      logMetrics({
        taskId,
        responseTime,
        sloViolated,
        decisionTime,
        memoryUsed: memoryUsed.toFixed(2),
        energy: energy.toFixed(4),
      });

      await this.notifyCloudCoordinator(decision, container, { healthy: isHealthy });
      this.logSorrirState();
    } catch (error) {
      console.error("Recovery error:", error);
      this.runSorrirTransition({
        id: uuidv4(),
        eventClass: "oneway",
        type: "VERIFICATION_FAILED",
        port: undefined,
      });
    }
  }

  private logSorrirState(): void {
    const entry = {
      timestamp: Date.now(),
      state: this.sorrirState.state.fsm,
      details: this.sorrirState.state.my,
    };

    const path = "./data/outputs/sorrir_bft_state.json";
    const current = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, "utf8"))
      : [];

    current.push(entry);
    fs.writeFileSync(path, JSON.stringify(current, null, 2));
  }

  resetToMonitoring(): void {
    this.runSorrirTransition({
      id: uuidv4(),
      eventClass: "oneway",
      type: "RESET_MONITOR",
      port: undefined,
    });
  }

  getSorrirState() {
    return this.sorrirState;
  }

  async checkContainerHealth(container: string): Promise<string> {
    return "healthy"; // stubbed
  }

  async getBFTDecision(state: string): Promise<string> {
    return "RECOVER"; // stubbed
  }

  async executeRecovery(decision: string, target: string): Promise<void> {
    console.log(`Executing recovery for ${target} with decision ${decision}`);
  }

  async testFaultyApp(): Promise<{ isHealthy: boolean }> {
    return { isHealthy: true }; // stubbed
  }

  async notifyCloudCoordinator(
    decision: string,
    container: string,
    result: any
  ): Promise<void> {
    console.log(`Notify cloud: ${container} decision=${decision} result=${JSON.stringify(result)}`);
  }
}

if (require.main === module) {
  const runner = new SorrirBFTRecoveryOrchestrator();
  runner.invokeSorrirBFTRecovery
  }
