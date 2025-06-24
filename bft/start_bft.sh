#!/bin/bash

# === CONFIGURATION ===
BASE_DIR="/home/rucha/Documents/CCNCS/MVP/RaaSwithSORRIR/bft"
CONFIG_DIR="config"
REPLICA_CLASS="bftsmart.mvptools.replica.Replica"
FRONTEND_CLASS="bftsmart.mvptools.frontend.Frontend"
# Add BouncyCastle to classpath
CLASSPATH="$BASE_DIR/bin:$BASE_DIR/lib/*:$BASE_DIR/lib/bcprov-jdk15on-1.70.jar"
REPLICA_IDS=(0 1 2 3)
CLIENT_ID=1001
FRONTEND_PORT=1200

cd "$BASE_DIR"

# === Graceful shutdown function ===
cleanup() {
    echo ""
    echo "🛑 Received termination signal. Shutting down gracefully..."
    echo "🧹 Stopping BFT system processes..."
    
    # Kill frontend first
    pkill -f "bftsmart.mvptools.frontend.Frontend" 2>/dev/null
    
    # Kill replicas
    for replica_id in ${REPLICA_IDS[@]}; do
        pkill -f "bftsmart.mvptools.replica.Replica.*$replica_id" 2>/dev/null
        echo "   Stopped replica $replica_id"
    done
    
    # Wait a moment for processes to terminate
    sleep 2
    
    # Force kill if still running
    pkill -9 -f "bftsmart.mvptools" 2>/dev/null || true
    
    echo "✅ BFT system stopped gracefully"
    exit 0
}

# === Set up signal handlers ===
trap cleanup SIGINT SIGTERM

# === Clean up any existing processes ===
echo "🧹 Cleaning up existing processes..."
pkill -f "bftsmart.mvptools" 2>/dev/null || true
sleep 2

# === Check if ports are available ===
echo "🔍 Checking port availability..."
for port in 11000 11001 11010 11011 11020 11021 11030 11031 1200; do
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
        echo "⚠️ Port $port is in use. Attempting to free it..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
done

# === Build the project ===
echo "📦 Building project with Ant..."
rm -rf bin/* 2>/dev/null || true
ant || { echo "❌ Build failed"; exit 1; }

# === Download BouncyCastle if not present ===
if [ ! -f "$BASE_DIR/lib/bcprov-jdk15on-1.70.jar" ]; then
    echo "📥 Downloading BouncyCastle provider..."
    mkdir -p "$BASE_DIR/lib"
    wget -O "$BASE_DIR/lib/bcprov-jdk15on-1.70.jar" \
        "https://repo1.maven.org/maven2/org/bouncycastle/bcprov-jdk15on/1.70/bcprov-jdk15on-1.70.jar" \
        || { echo "❌ Failed to download BouncyCastle"; exit 1; }
fi

# === Clean any existing view files ===
rm -f "$BASE_DIR/$CONFIG_DIR/currentView" 2>/dev/null || true

# === Launch Replicas ===
echo "🚀 Starting replicas..."
for i in ${!REPLICA_IDS[@]}; do
    echo "Starting replica ${REPLICA_IDS[$i]}..."
    java -Djava.security.properties="$BASE_DIR/$CONFIG_DIR/java.security" \
         -cp "$CLASSPATH" \
         "$REPLICA_CLASS" "${REPLICA_IDS[$i]}" &
    
    # Wait a bit longer between replica starts to avoid race conditions
    sleep 3
    
    # Check if replica started successfully
    if ! pgrep -f "bftsmart.mvptools.replica.Replica.*${REPLICA_IDS[$i]}" > /dev/null; then
        echo "❌ Failed to start replica ${REPLICA_IDS[$i]}"
    else
        echo "✅ Replica ${REPLICA_IDS[$i]} started successfully"
    fi
done

# === Wait for replicas to initialize ===
echo "⏳ Waiting for replicas to initialize..."
sleep 5

# === Launch Frontend ===
echo "🟢 Starting frontend..."
java -Djava.security.properties="$BASE_DIR/$CONFIG_DIR/java.security" \
     -cp "$CLASSPATH" \
     "$FRONTEND_CLASS" "$CLIENT_ID" "$FRONTEND_PORT" "$CONFIG_DIR" true nosig &

# Wait for frontend to start
sleep 3

if pgrep -f "bftsmart.mvptools.frontend.Frontend" > /dev/null; then
    echo "✅ Frontend started successfully on port $FRONTEND_PORT"
    echo "🎉 BFT system is running!"
    echo "📡 You can now connect to tcp://127.0.0.1:$FRONTEND_PORT"
    echo ""
    echo "💡 Press Ctrl+C to stop the system gracefully"
else
    echo "❌ Failed to start frontend"
    cleanup
    exit 1
fi

# Keep script running and wait for signals
while true; do
    sleep 1
    
    # Check if processes are still running
    if ! pgrep -f "bftsmart.mvptools" > /dev/null; then
        echo "⚠️ BFT processes have stopped unexpectedly"
        break
    fi
done
