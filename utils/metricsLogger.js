// metricsLogger.js
const fs = require('fs');
const path = './data/outputs/metrics_log.csv';

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, 'taskId,responseTime(ms),sloViolated,decisionTime(ms),memoryUsed(MB),energy(kWh)\n');
}

function logMetrics({ taskId, responseTime, sloViolated, decisionTime, memoryUsed, energy }) {
  console.log("Logging...");
  const line = `${taskId},${responseTime},${sloViolated},${decisionTime},${memoryUsed},${energy}\n`;
  fs.appendFileSync(path, line);
}

module.exports = { logMetrics };

