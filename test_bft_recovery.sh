#!/bin/bash

# test-bft-recovery.sh - Test script for BFT recovery with your existing setup

echo "🚀 Testing BFT Recovery with Existing Docker Setup"
echo "================================================="

# 1. Start your existing services
echo "📦 Starting Docker services..."
docker-compose up -d
sleep 10

# 2. Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# 3. Test faulty app endpoint
echo "🧪 Testing faulty app health..."
curl -s http://localhost:3000/health && echo " ✅ Health check passed"

# 4. Create test data directory
echo "📁 Creating test data directory..."
mkdir -p data/outputs

# 5. Compile and run BFT recovery integration
echo "🔧 Compiling BFT recovery integration..."
npx tsc bft_recovery_integration.ts

# 6. Run the recovery test
echo "🎯 Running BFT recovery test..."
node bft_recovery_integration.js

# 7. Check logs
echo "📊 Checking recovery logs..."
if [ -f "data/outputs/bft_recovery_log.json" ]; then
    echo "Recovery log created:"
    cat data/outputs/bft_recovery_log.json | jq .
fi

# 8. Monitor containers after recovery
echo "🔍 Final container status:"
docker-compose ps

echo "✅ BFT Recovery test completed!"

# Optional: Run continuous monitoring
read -p "🔄 Start continuous monitoring? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔍 Starting continuous monitoring..."
    node monitor.js
fi

# 9. Graceful shutdown of Docker services
echo "🛑 Shutting down Docker services gracefully..."
docker-compose down
echo "✅ All services stopped cleanly."

