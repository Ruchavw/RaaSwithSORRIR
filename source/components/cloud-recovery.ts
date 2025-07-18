// source/components/cloud-recovery.ts
import { Event, FSMState } from "@sorrir/framework";
import fetch from "node-fetch";
import { execSync } from "child_process";
export enum EventType {
  COMMAND = "COMMAND",
  EVENT = "EVENT",
  INTERNAL = "INTERNAL",
}
const CLOUD_ID = "cloud-coordinator";

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
  const cmd = `java -cp bft/bin bftsmart.mvptools.recovery.BFTRecoveryDecision ${states.join(
    " "
  )}`;
  const output = execSync(cmd).toString().trim();
  return output === "RESET" ? "RESET" : "RECOVER";
}

// ✅ Recovery logic based on FSM state analysis
export async function performCloudRecovery(sensorStates: FSMState[]) {
  console.log("☁️ [Cloud] Invoking BFT Recovery using final sensor state...");

  const controlStates = sensorStates.map((s) => s.controlState);
  const decision = getBFTDecision(controlStates);

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
