// source/components/cloud-recovery.ts
import { Event, FSMState } from "@sorrir/framework";
import fetch from "node-fetch";
import { execSync } from "child_process";
const { logMetrics } = require('../../utils/metricsLogger'); // Adjust path if needed

export enum EventType {
  COMMAND = "COMMAND",
  EVENT = "EVENT",
  INTERNAL = "INTERNAL",
}

const CLOUD_ID = "cloud-coordinator";
const SLO_DEADLINE = 2000; // Set your desired SLO deadline in ms

// ✅ Send FSM event to HTTP endpoint
export async function sendEvent(event: Event) {
  const port = 1235; // Adjust if needed
  const url = `http://localhost:${port}/b/${event.receiver}/FROM_${event.sender}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  });
}

// ✅ Java-based BFT consensus invocation
function getBFTDecision(states: string[]): "RECOVER" | "RESET" {
  const cmd = `java -cp bft/bin bftsmart.mvptools.recovery.BFTRecoveryDecision ${states.join(" ")}`;
  const output = execSync(cmd).toString().trim();
  return output === "RESET" ? "RESET" : "RECOVER";
}

// ✅ Recovery logic with metric logging
export async function performCloudRecovery(sensorStates: FSMState[]) {
  console.log("☁️ [Cloud] Invoking BFT Recovery using final sensor state...");

  const detectTime = Date.now();

  const controlStates = sensorStates.map((s) => s.controlState);
  const decision = getBFTDecision(controlStates);

  const recoverTime = Date.now();
  const decisionTime = recoverTime - detectTime;

  const responseTime = decisionTime; // In your context, responseTime ≈ decisionTime
  const sloViolated = responseTime > SLO_DEADLINE ? 1 : 0;
  const memoryUsed = process.memoryUsage().heapUsed / 1024 / 1024;

  // Estimate energy (can refine based on your system’s uptime and CPU profile)
  const uptimeSeconds = process.uptime();
  const cpuUsagePercent = 25; // Replace with dynamic % if available
  const energy = cpuUsagePercent * uptimeSeconds * 0.000277;

  // Generate unique ID or source ID for logging
  const taskId = `cloud-recovery-${Date.now()}`;

  logMetrics({
    taskId,
    responseTime,
    sloViolated,
    decisionTime,
    memoryUsed: memoryUsed.toFixed(2),
    energy: energy.toFixed(4),
  });

  const event: Event = {
    sender: CLOUD_ID,
    receiver: "system-coordinator",
    type: EventType.COMMAND,
    payload: decision,
    timestamp: Date.now(),
  };

  await sendEvent(event);
  console.log(`[CLOUD] Consensus result = ${decision}. Event sent.`);
}

