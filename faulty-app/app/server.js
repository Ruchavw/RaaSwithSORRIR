/// server.js (Faulty Node.js Web App)
const express = require('express');
const app = express();
const port = 3000;

let memoryLeak = [];

app.get('/health', (req, res) => {
  res.send('OK');
});

app.get('/simulate', (req, res) => {
  const roll = Math.random();
  if (roll < 0.2) {
    console.log("\u{1F4A5} Crashing...");
    process.exit(1);
  } else if (roll < 0.5) {
    console.log("\u{1F422} Delaying...");
    setTimeout(() => res.send('Delayed response'), 10000);
  } else {
    memoryLeak.push(Buffer.alloc(10 ** 6, 'leak'));
    console.log("\u{1F422} Leaky success...");
    res.send('Leaky success');
  }
});

app.listen(port, () => {
  console.log(`Faulty IoT App running on http://localhost:${port}`);
});

