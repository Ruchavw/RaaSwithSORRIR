const express = require('express');
const app = express();
const port = 3000;

let memoryLeak = [];
let crashCount = 0;
let startTime = Date.now();
let autoRefreshInterval = null;

// Auto-refresh mechanism
function scheduleAutoRefresh() {
  if (autoRefreshInterval) clearTimeout(autoRefreshInterval);
  const interval = Math.random() * 4000 + 8000;
  console.log(`🔄 Scheduling auto-refresh in ${Math.round(interval / 1000)}s`);

  autoRefreshInterval = setTimeout(() => {
    console.log("🔄 Auto-refresh triggered!");
    const refreshType = Math.random();

    if (refreshType < 0.3) {
      console.log("🧹 Auto-refresh: Memory cleanup");
      memoryLeak = [];
    } else if (refreshType < 0.6) {
      console.log("🔄 Auto-refresh: Simulated restart");
      memoryLeak = [];
      crashCount = 0;
    } else if (refreshType < 0.8) {
      console.log("⚡ Auto-refresh: Adding load");
      memoryLeak.push(Buffer.alloc(10 ** 6, 'refresh-load'));
    } else {
      console.log("💥 Auto-refresh: Potential crash");
      if (Math.random() < 0.5) {
        console.log("💥 Auto-refresh caused crash!");
        process.exit(1);
      }
    }

    scheduleAutoRefresh();
  }, interval);
}

scheduleAutoRefresh();

// Middleware
app.use(express.json());

// GET /health
app.get('/health', (req, res) => {
  const uptime = Date.now() - startTime;
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'OK',
    uptime,
    crashCount,
    memoryLeakSize: memoryLeak.length,
    memoryUsage: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    pid: process.pid,
    nextRefresh: autoRefreshInterval ? "scheduled" : "none",
    timestamp: Date.now()
  });
});

// GET /simulate
app.get('/simulate', (req, res) => simulateFault(req, res));

// POST /simulate
app.post('/simulate', (req, res) => simulateFault(req, res));

// POST /recover
app.post('/recover', (req, res) => {
  console.log("🔧 POST /recover received — executing recovery logic");
  if (autoRefreshInterval) clearTimeout(autoRefreshInterval);
  memoryLeak = [];
  crashCount = 0;
  scheduleAutoRefresh();

  res.json({
    status: 'recovered',
    message: 'Recovery executed',
    timestamp: Date.now()
  });
});

// POST /refresh (manual restart)
app.post('/refresh', (req, res) => {
  console.log("🔄 Manual refresh triggered");
  if (autoRefreshInterval) clearTimeout(autoRefreshInterval);
  memoryLeak = [];
  crashCount = 0;
  scheduleAutoRefresh();
  res.json({
    status: 'refreshed',
    message: 'Application refreshed',
    timestamp: Date.now()
  });
});

// GET /status
app.get('/status', (req, res) => {
  res.json({
    uptime: Date.now() - startTime,
    crashCount,
    memoryLeakSize: memoryLeak.length,
    memoryUsage: process.memoryUsage(),
    pid: process.pid,
    autoRefreshActive: !!autoRefreshInterval,
    version: "1.0.0-faulty",
    timestamp: Date.now()
  });
});

// Fault simulation logic
function simulateFault(req, res) {
  const roll = Math.random();
  const requestId = Math.random().toString(36).substring(2, 9);
  console.log(`🎲 [${requestId}] Simulate request (roll: ${roll.toFixed(3)})`);

  if (roll < 0.15) {
    crashCount++;
    console.log(`💥 [${requestId}] Crashing... (crash #${crashCount})`);
    res.status(500).json({
      status: 'crashing',
      message: 'Application is crashing',
      requestId,
      crashCount
    });
    setTimeout(() => process.exit(1), 100);
  } else if (roll < 0.4) {
    const delay = Math.random() * 8000 + 2000;
    console.log(`🐌 [${requestId}] Delaying for ${Math.round(delay / 1000)}s...`);
    setTimeout(() => {
      res.json({
        status: 'delayed',
        message: 'Delayed response',
        requestId,
        delay: Math.round(delay),
        timestamp: Date.now()
      });
    }, delay);
  } else if (roll < 0.7) {
    const leakSize = Math.floor(Math.random() * 5) + 1;
    for (let i = 0; i < leakSize; i++) {
      memoryLeak.push(Buffer.alloc(10 ** 6, 'leak'));
    }
    console.log(`🕳️ [${requestId}] Memory leak: +${leakSize}MB (total: ${memoryLeak.length}MB)`);
    res.json({
      status: 'leaky_success',
      message: 'Success with memory leak',
      requestId,
      leakAdded: leakSize,
      totalLeak: memoryLeak.length,
      timestamp: Date.now()
    });
  } else {
    console.log(`✅ [${requestId}] Normal success`);
    res.json({
      status: 'success',
      message: 'Normal operation',
      requestId,
      timestamp: Date.now()
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (autoRefreshInterval) clearTimeout(autoRefreshInterval);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  if (autoRefreshInterval) clearTimeout(autoRefreshInterval);
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Faulty IoT App running on http://localhost:${port}`);
  console.log(`🔄 Auto-refresh enabled with ~10s intervals`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /health   - Health check with detailed info`);
  console.log(`   GET  /simulate - Simulate various fault conditions`);
  console.log(`   POST /simulate - Orchestrator-compatible fault simulation`);
  console.log(`   POST /recover  - Orchestrator recovery trigger`);
  console.log(`   POST /refresh  - Manual refresh/cleanup`);
  console.log(`   GET  /status   - Detailed status information`);
});

console.log(`🌟 Faulty App started at ${new Date().toISOString()}`);
console.log(`📋 Configuration:`);
console.log(`   - Auto-refresh: ~10s intervals`);
console.log(`   - Crash probability: 15%`);
console.log(`   - Delay probability: 25%`);
console.log(`   - Memory leak probability: 30%`);
console.log(`   - Success probability: 30%`);

