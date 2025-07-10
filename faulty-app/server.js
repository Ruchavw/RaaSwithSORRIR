const express = require('express');
const app = express();
const port = 3000;

let memoryLeak = [];
let resourceLock = false;

// Simulate health check
app.get('/health', (req, res) => {
  res.send('OK');
});

// Simulate random crash, delay, or memory leak
app.get('/simulate', (req, res) => {
  const roll = Math.random();
  if (roll < 0.2) {
    console.log("🔁 Simulating CPU spike...");
    process.exit(1);
  } else if (roll < 0.5) {
    console.log("🐢 Delaying...");
    setTimeout(() => res.send('Delayed response'), 10000);
  } else {
    memoryLeak.push(Buffer.alloc(10 ** 6, 'leak'));
    console.log("🐍 Leaky success...");
    res.send('Leaky success');
  }
});

// CPU spike simulation
app.get('/cpu', (req, res) => {
  console.log("💥 Crashing...");
  const start = Date.now();
  while (Date.now() - start < 10000); // spin for 10 seconds
  res.send('CPU spike complete');
});

// Memory exhaustion
app.get('/memory', (req, res) => {
  console.log("🧠 Exhausting memory...");
  for (let i = 0; i < 100; i++) {
    memoryLeak.push(Buffer.alloc(5 * 10 ** 6)); // 5MB chunks
  }
  res.send('Memory being consumed');
});

// Deadlock simulation
app.get('/deadlock', (req, res) => {
  console.log("🔒 Simulating deadlock...");
  if (resourceLock) {
    return res.send('Resource already locked. Waiting...');
  }
  resourceLock = true;
  setTimeout(() => {
    resourceLock = false;
    console.log("🔓 Deadlock released");
  }, 30000); // lock held for 30 seconds
  res.send('Resource locked. Deadlock in progress.');
});

// Panic simulation
app.get('/panic', (req, res) => {
  console.log("🛑 Throwing uncaught exception...");
  throw new Error("Simulated panic: uncaught exception");
});

// Silent failure
app.get('/silent', (req, res) => {
  console.log("🕯️ Silent failure...");
  res.status(200).send(); // 200 OK with no content
});

// Resource starvation (simulate with open files or sockets — here we simulate with delay and loop)
app.get('/starve', (req, res) => {
  console.log("🧊 Simulating resource starvation...");
  setTimeout(() => {
    res.send('Starved for resources...');
  }, 20000); // long delay
});

// Redirect on root `/` to a random fault
app.get('/', (req, res) => {
  const routes = ['/simulate', '/cpu', '/memory', '/deadlock', '/panic', '/silent', '/starve'];
  const selected = routes[Math.floor(Math.random() * routes.length)];
  console.log(`🔁 Redirecting to: ${selected}`);
  res.setHeader("X-Fault-Simulated", selected);
  res.redirect(selected);
});

// Global error handler to prevent crash on panic
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught error:", err.message);
  res.status(500).send("Server panicked but caught globally.");
});

app.listen(port, () => {
  console.log(`🛠️ Faulty IoT App running at http://localhost:${port}`);
});
