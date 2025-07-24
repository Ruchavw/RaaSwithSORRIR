const { logMetrics } = require('./utils/metricsLogger');
const { SorrirBFTRecoveryOrchestrator } = require('./sorrir_bft_integration.js');
const orchestrator = new SorrirBFTRecoveryOrchestrator();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { exec } = require('child_process');

let running = true;
let cycle = 1;
let previousCrashCount = 0;
let lastRestartTime = 0;
const cooldownMs = 10000; // 10 seconds

function logCrashMetrics() {
  const taskId = `crash-${Date.now()}`;
  const responseTime = 0;
  const sloViolated = 1;
  const decisionTime = 0;
  const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const uptimeSeconds = process.uptime();
  const cpuUsagePercent = 25;
  const energy = (cpuUsagePercent * uptimeSeconds * 0.000277).toFixed(4);

  console.log("📊 Crash detected — logging metrics...");
  logMetrics({ taskId, responseTime, sloViolated, decisionTime, memoryUsed, energy });
}

process.on('SIGINT', () => {
  console.log('\n🛑 Received Ctrl+C. Stopping monitoring gracefully...');
  running = false;
});

(async () => {
  console.log("📡 Monitoring 'faulty-app'. Ctrl+C to exit.\n");

  while (running) {
    const now = Date.now();

    // Skip probing if still cooling down
    if (now - lastRestartTime < cooldownMs) {
      console.log("🧘 Cooldown in progress... Skipping this cycle.\n");
      await new Promise(res => setTimeout(res, 1000));
      continue;
    }

    console.log(`🔁 Cycle ${cycle} — Probing app at http://localhost:3000 ...`);

    try {
      const response = await fetch('http://localhost:3000/health', { timeout: 5000 });
      const health = await response.json();

      const { crashCount, memoryLeakSize, status } = health;

      if (crashCount > previousCrashCount) {
        console.log(`💥 Crash detected (crashCount increased to ${crashCount}) — Restarting container...`);
        previousCrashCount = crashCount;
        lastRestartTime = now;

        logCrashMetrics(); // Log before restarting

        exec('docker restart faulty-app', (err, stdout, stderr) => {
          if (err) console.error(`❌ Restart failed: ${stderr}`);
          else console.log(`♻️ Container restarted.\n`);
        });

      } else if (memoryLeakSize > 10) {
        console.log(`🕳️ Memory leak detected (${memoryLeakSize}MB) — Triggering recovery...`);
        await orchestrator.invokeSorrirBFTRecovery('faulty-app');

      } else if (status !== 'OK') {
        console.log(`⚠️ App reported status '${status}' — Recovering...`);
        await orchestrator.invokeSorrirBFTRecovery('faulty-app');

      } else {
        console.log(`✅ App is healthy. No action required.\n`);
      }

    } catch (error) {
      console.error(`🚫 App unreachable — forcing container restart.`);
      lastRestartTime = now;

      logCrashMetrics(); // Log unreachable crash

      exec('docker restart faulty-app', (err, stdout, stderr) => {
        if (err) console.error(`❌ Restart failed: ${stderr}`);
        else console.log(`🔁 Container restarted due to unreachability.\n`);
      });
    }

    cycle++;
    console.log(`⏳ Waiting before next cycle...\n`);
    await new Promise(res => setTimeout(res, 10000));
  }

  console.log("✅ Monitor stopped cleanly.");
})();

