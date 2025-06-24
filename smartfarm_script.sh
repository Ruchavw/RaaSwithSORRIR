#!/bin/bash

# SmartFarmCCTV Compilation and Execution Script

echo "Starting SmartFarmCCTV compilation and execution..."

# Create output directory if it doesn't exist
mkdir -p out

# Compile the Java application
echo "Compiling SmartFarmCCTV..."
javac -cp "iFogSim/src:libs/*" SmartFarmCCTV.java -d out

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "Compilation successful!"
    
    # Run the application
    echo "Running SmartFarmCCTV..."
    java -cp "out:iFogSim/src:libs/*" org.fog.test.perfeval.SmartFarmCCTV
else
    echo "Compilation failed!"
    exit 1
fi

echo "SmartFarmCCTV execution completed."
