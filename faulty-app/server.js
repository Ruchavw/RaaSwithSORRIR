const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());

const PORT = 3000;

// Crash tracking file
const crashCountFile = '/tmp/crash-count.json';

function readCrashCount() {
  try {
    const raw = fs.readFileSync(crashCountFile);
    return JSON.parse(raw).count || 0;
  } catch {
    return 0;
  }
}

function writeCrashCount(count) {
  fs.writeFileSync(crashCountFile, JSON.stringify({ count }));
}

// Initialize crash count from file
let crashCount = readCrashCount();

// Simulated app state
let memoryLeakSize = 0;
let refreshTimer;
let pid = process.pid;
let uptimeStart = Date.now();
let status = 'OK';

// Random auto-refresh every 8–12 seconds
function scheduleAutoRefresh() {
  const delay = Math.floor(Math.random() * 4000) + 8000;
  refreshTimer = setTimeout(() => {
    const scenarios = ['success', 'crashing', 'leaky_success', 'cleanup'];
    const chosen = scenarios[Math.floor(Math.random() * scenarios.length)];

    switch (chosen) {
      case 'crashing':
        crashCount++;
        writeCrashCount(crashCount);
        console.log("💥 Simulated crash. Exiting...");
        process.exit(1);
        break;
      case 'leaky_success':
        memoryLeakSize += 5;
        status = 'degraded';
        console.log(`🕳️ Simulated memory leak. Total = ${memoryLeakSize}MB`);
        break;
      case 'cleanup':
        memoryLeakSize = 0;
        status = 'OK';
        console.log("🧹 Cleaned up memory leak.");
        break;
      default:
        status = 'OK';
        console.log("✅ Normal operation.");
    }

    scheduleAutoRefresh(); // reschedule
  }, delay);
}

scheduleAutoRefresh();

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status,
    crashCount,
    memoryLeakSize,
    memoryUsage: process.memoryUsage(),
    uptime: Math.floor((Date.now() - uptimeStart) / 1000),
    pid,
    timestamp: Date.now(),
  });
});

// Simulate fault manually
app.post('/simulate', (req, res) => {
  const scenario = req.body.scenario || 'success';
  let response = {};

  switch (scenario) {
    case 'crashing':
      crashCount++;
      writeCrashCount(crashCount);
      response = {
        status: 'crashing',
        message: 'Application is crashing',
        requestId: Math.random().toString(36).slice(7),
        crashCount,
      };
      console.log("💥 Manual crash simulation.");
      res.json(response);
      return process.exit(1);

    case 'leaky_success':
      memoryLeakSize += 5;
      status = 'degraded';
      response = {
        status: 'leaky_success',
        message: 'Success with memory leak',
        requestId: Math.random().toString(36).slice(7),
        leakAdded: 5,
        totalLeak: memoryLeakSize,
        timestamp: Date.now(),
      };
      console.log("🕳️ Manual memory leak.");
      return res.json(response);

    default:
      status = 'OK';
      response = {
        status: 'success',
        message: 'Normal operation',
        requestId: Math.random().toString(36).slice(7),
        timestamp: Date.now(),
      };
      console.log("✅ Manual simulate success.");
      return res.json(response);
  }
});

// Recovery endpoint
app.post('/recover', (req, res) => {
  memoryLeakSize = 0;
  status = 'OK';
  crashCount = 0;
  writeCrashCount(crashCount);
  console.log("🔧 Recovery logic triggered.");
  res.json({
    status: 'recovered',
    message: 'Recovery executed',
    timestamp: Date.now(),
  });
});

app.listen(PORT, () => {
  console.log(`🧠 Faulty app running on port ${PORT}`);
});

