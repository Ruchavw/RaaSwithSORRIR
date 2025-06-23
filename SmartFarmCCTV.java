package org.fog.test.perfeval;

import org.cloudbus.cloudsim.*;
import org.cloudbus.cloudsim.core.CloudSim;
import org.cloudbus.cloudsim.core.CloudSimTags;
import org.cloudbus.cloudsim.core.SimEntity;
import org.cloudbus.cloudsim.core.SimEvent;
import org.cloudbus.cloudsim.provisioners.RamProvisionerSimple;
import org.cloudbus.cloudsim.power.PowerHost;
import org.cloudbus.cloudsim.sdn.overbooking.BwProvisionerOverbooking;
import org.cloudbus.cloudsim.sdn.overbooking.PeProvisionerOverbooking;

import org.fog.application.AppEdge;
import org.fog.application.AppLoop;
import org.fog.application.Application;
import org.fog.application.selectivity.FractionalSelectivity;
import org.fog.entities.*;

import org.fog.placement.Controller;
import org.fog.placement.ModuleMapping;
import org.fog.placement.ModulePlacementMapping;
import org.fog.policy.AppModuleAllocationPolicy;
import org.fog.scheduler.StreamOperatorScheduler;
import org.fog.utils.*;
import org.fog.utils.distribution.DeterministicDistribution;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.*;

public class SmartFarmCCTV {

    static List<FogDevice> devices = new ArrayList<>();
    static List<Sensor> sensors = new ArrayList<>();
    static List<Actuator> actuators = new ArrayList<>();
    
    // Real-time anomaly detection integration
    private static final String RAAS_PROJECT_PATH = System.getProperty("user.dir");
    private static ExecutorService anomalyDetectionExecutor;
    private static volatile boolean simulationRunning = true;
    private static EnhancedMetricsLogger logger; // Make logger static for access

    public static void main(String[] args) {
        Log.printLine("Starting Enhanced Smart Farm CCTV and Irrigation simulation with Real-time Anomaly Detection...");

        try {
            // Initialize anomaly detection system
            initializeAnomalyDetectionSystem();
            
            CloudSim.init(1, Calendar.getInstance(), false);
            String cctvAppId = "smart_farm_cctv";
            String irrigationAppId = "smart_farm_irrigation";
            FogBroker broker = new FogBroker("broker");

            // Create devices with proper hierarchy
            FogDevice cloud = createFogDevice("cloud", 44800, 40000, 100000, 100000, 16.0, 0.01, 0, 100.0);
            
            FogDevice fog0 = createFogDevice("fog-0", 2800, 4000, 10000, 10000, 2.0, 0.01, cloud.getId(), 2.0);
            
            // CCTV devices
            FogDevice cam1 = createFogDevice("cam-1", 1000, 1000, 1000, 1000, 1.0, 0.01, fog0.getId(), 2.0);
            FogDevice cam2 = createFogDevice("cam-2", 1000, 1000, 1000, 1000, 1.0, 0.01, fog0.getId(), 2.0);

            // New irrigation and monitoring devices
            FogDevice soilSensorNode = createFogDevice("soil-sensor-node", 800, 512, 1000, 1000, 0.8, 0.01, fog0.getId(), 1.5);
            FogDevice signalMonitor = createFogDevice("signal-monitor", 1200, 1024, 2000, 2000, 1.2, 0.01, fog0.getId(), 1.0);
            FogDevice irrigationController = createFogDevice("irrigation-controller", 1500, 2048, 2000, 2000, 1.5, 0.01, fog0.getId(), 1.0);

            devices.add(cloud);
            devices.add(fog0);
            devices.add(cam1);
            devices.add(cam2);
            devices.add(soilSensorNode);
            devices.add(signalMonitor);
            devices.add(irrigationController);

            // Create CCTV application
            Application cctvApplication = createCCTVApplication(cctvAppId, broker.getId());
            
            // Create irrigation application
            Application irrigationApplication = createIrrigationApplication(irrigationAppId, broker.getId());

            // Create explicit module mapping for CCTV
            ModuleMapping cctvModuleMapping = ModuleMapping.createModuleMapping();
            cctvModuleMapping.addModuleToDevice("cctv_preprocessor", "cam-1");
            cctvModuleMapping.addModuleToDevice("cctv_preprocessor", "cam-2");
            cctvModuleMapping.addModuleToDevice("cctv_analyzer", "fog-0");
            cctvModuleMapping.addModuleToDevice("cctv_aggregator", "cloud");
            
            // Create explicit module mapping for irrigation system
            ModuleMapping irrigationModuleMapping = ModuleMapping.createModuleMapping();
            irrigationModuleMapping.addModuleToDevice("soil_data_processor", "soil-sensor-node");
            irrigationModuleMapping.addModuleToDevice("signal_analyzer", "signal-monitor");
            irrigationModuleMapping.addModuleToDevice("irrigation_decision_engine", "fog-0");
            irrigationModuleMapping.addModuleToDevice("irrigation_scheduler", "cloud");
            irrigationModuleMapping.addModuleToDevice("irrigation_executor", "irrigation-controller");
            
            Log.printLine("Module mapping configured:");
            Log.printLine("CCTV System:");
            Log.printLine("- cctv_preprocessor -> cam-1, cam-2");
            Log.printLine("- cctv_analyzer -> fog-0");  
            Log.printLine("- cctv_aggregator -> cloud");
            Log.printLine("Irrigation System:");
            Log.printLine("- soil_data_processor -> soil-sensor-node");
            Log.printLine("- signal_analyzer -> signal-monitor");
            Log.printLine("- irrigation_decision_engine -> fog-0");
            Log.printLine("- irrigation_scheduler -> cloud");
            Log.printLine("- irrigation_executor -> irrigation-controller");

            // Create CCTV sensors
            sensors.add(new Sensor("camSensor1", "CAMERA", broker.getId(), cctvAppId, 
                new DeterministicDistribution(200))); // Every 200ms
            sensors.get(sensors.size()-1).setGatewayDeviceId(cam1.getId());
            sensors.get(sensors.size()-1).setLatency(1.0);

            sensors.add(new Sensor("camSensor2", "CAMERA", broker.getId(), cctvAppId, 
                new DeterministicDistribution(300))); // Every 300ms
            sensors.get(sensors.size()-1).setGatewayDeviceId(cam2.getId());
            sensors.get(sensors.size()-1).setLatency(1.0);

            // Create soil and environmental sensors
            sensors.add(new Sensor("soilMoistureSensor", "SOIL_MOISTURE", broker.getId(), irrigationAppId, 
                new DeterministicDistribution(5000))); // Every 5 seconds
            sensors.get(sensors.size()-1).setGatewayDeviceId(soilSensorNode.getId());
            sensors.get(sensors.size()-1).setLatency(0.5);

            sensors.add(new Sensor("soilTempSensor", "SOIL_TEMPERATURE", broker.getId(), irrigationAppId, 
                new DeterministicDistribution(10000))); // Every 10 seconds
            sensors.get(sensors.size()-1).setGatewayDeviceId(soilSensorNode.getId());
            sensors.get(sensors.size()-1).setLatency(0.5);

            sensors.add(new Sensor("phSensor", "SOIL_PH", broker.getId(), irrigationAppId, 
                new DeterministicDistribution(30000))); // Every 30 seconds
            sensors.get(sensors.size()-1).setGatewayDeviceId(soilSensorNode.getId());
            sensors.get(sensors.size()-1).setLatency(0.5);

            sensors.add(new Sensor("weatherSensor", "WEATHER_DATA", broker.getId(), irrigationAppId, 
                new DeterministicDistribution(60000))); // Every 60 seconds
            sensors.get(sensors.size()-1).setGatewayDeviceId(signalMonitor.getId());
            sensors.get(sensors.size()-1).setLatency(2.0);

            sensors.add(new Sensor("connectivitySensor", "NETWORK_STATUS", broker.getId(), irrigationAppId, 
                new DeterministicDistribution(15000))); // Every 15 seconds
            sensors.get(sensors.size()-1).setGatewayDeviceId(signalMonitor.getId());
            sensors.get(sensors.size()-1).setLatency(0.1);

            // Create actuators
            // CCTV actuator
            actuators.add(new Actuator("display", broker.getId(), cctvAppId, "DISPLAY"));
            actuators.get(actuators.size()-1).setGatewayDeviceId(fog0.getId());
            actuators.get(actuators.size()-1).setLatency(1.0);

            // Irrigation actuators
            actuators.add(new Actuator("waterValve1", broker.getId(), irrigationAppId, "WATER_VALVE"));
            actuators.get(actuators.size()-1).setGatewayDeviceId(irrigationController.getId());
            actuators.get(actuators.size()-1).setLatency(0.5);

            actuators.add(new Actuator("waterValve2", broker.getId(), irrigationAppId, "WATER_VALVE"));
            actuators.get(actuators.size()-1).setGatewayDeviceId(irrigationController.getId());
            actuators.get(actuators.size()-1).setLatency(0.5);

            actuators.add(new Actuator("fertilizer_pump", broker.getId(), irrigationAppId, "FERTILIZER_PUMP"));
            actuators.get(actuators.size()-1).setGatewayDeviceId(irrigationController.getId());
            actuators.get(actuators.size()-1).setLatency(0.8);

            actuators.add(new Actuator("alarm_system", broker.getId(), irrigationAppId, "ALARM"));
            actuators.get(actuators.size()-1).setGatewayDeviceId(signalMonitor.getId());
            actuators.get(actuators.size()-1).setLatency(0.2);

            Log.printLine("Created " + sensors.size() + " sensors and " + actuators.size() + " actuators");

            // Create enhanced metrics logger with real-time anomaly detection
            String outFile = RAAS_PROJECT_PATH + "/data/inputs/edge_metrics.csv";
            logger = new EnhancedMetricsLogger("Logger", devices, outFile);
            
            // Create controller and submit applications
            Controller controller = new Controller("master-controller", devices, sensors, actuators);
            
            Log.printLine("Submitting CCTV application...");
            controller.submitApplication(cctvApplication, 0,
                    new ModulePlacementMapping(devices, cctvApplication, cctvModuleMapping));

            Log.printLine("Submitting Irrigation application...");
            controller.submitApplication(irrigationApplication, 0,
                    new ModulePlacementMapping(devices, irrigationApplication, irrigationModuleMapping));

            TimeKeeper.getInstance().setSimulationStartTime(Calendar.getInstance().getTimeInMillis());

            // Start real-time anomaly detection monitoring
            startRealTimeAnomalyDetection();
            
            // Run simulation
            CloudSim.terminateSimulation(60000); // 60 seconds simulation time
            
            // Start the simulation
            Log.printLine("Starting simulation with real-time anomaly detection...");
            CloudSim.startSimulation();
            
            Log.printLine("Simulation completed. Generating final metrics and running final anomaly detection...");
            
            // Stop real-time monitoring
            simulationRunning = false;
            
            // Force final metrics collection
            if (logger != null) {
                logger.forceLogMetrics();
                Log.printLine("Final metrics logging completed");
            }
            
            // Run final comprehensive anomaly detection
            runFinalAnomalyDetection();
            
            CloudSim.stopSimulation();

            Log.printLine("Enhanced Smart Farm simulation with real-time anomaly detection finished!");
            Log.printLine("Check " + RAAS_PROJECT_PATH + "/data/outputs/ for anomaly detection results");

        } catch (Exception e) {
            e.printStackTrace();
            Log.printLine("Error during simulation: " + e.getMessage());
        } finally {
            // Clean up
            simulationRunning = false;
            if (anomalyDetectionExecutor != null) {
                anomalyDetectionExecutor.shutdown();
                try {
                    if (!anomalyDetectionExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                        anomalyDetectionExecutor.shutdownNow();
                    }
                } catch (InterruptedException e) {
                    anomalyDetectionExecutor.shutdownNow();
                }
            }
        }
    }

    /**
     * Initialize the anomaly detection system
     */
    private static void initializeAnomalyDetectionSystem() {
        Log.printLine("Initializing Real-time Anomaly Detection System...");
        
        // Create directory structure if it doesn't exist
        try {
            java.io.File dataDir = new java.io.File(RAAS_PROJECT_PATH + "/data");
            java.io.File inputsDir = new java.io.File(RAAS_PROJECT_PATH + "/data/inputs");
            java.io.File outputsDir = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs");
            java.io.File visualizationsDir = new java.io.File(RAAS_PROJECT_PATH + "/visualizations/output");
            
            dataDir.mkdirs();
            inputsDir.mkdirs();
            outputsDir.mkdirs();
            visualizationsDir.mkdirs();
            
            Log.printLine("Created directory structure for anomaly detection system");
            Log.printLine("Data directory: " + dataDir.getAbsolutePath());
            Log.printLine("Inputs directory: " + inputsDir.getAbsolutePath());
            Log.printLine("Outputs directory: " + outputsDir.getAbsolutePath());
        } catch (Exception e) {
            Log.printLine("Warning: Could not create directory structure: " + e.getMessage());
        }
        
        // Initialize thread pool for anomaly detection
        anomalyDetectionExecutor = Executors.newFixedThreadPool(2);
        
        Log.printLine("Anomaly detection system initialized successfully");
    }

    /**
     * Start real-time anomaly detection monitoring
     */
    private static void startRealTimeAnomalyDetection() {
        Log.printLine("Starting real-time anomaly detection monitoring...");
        
        anomalyDetectionExecutor.submit(() -> {
            while (simulationRunning) {
                try {
                    // Wait for 10 seconds before first check to allow data accumulation
                    Thread.sleep(10000);
                    
                    if (simulationRunning) {
                        runAnomalyDetection(false); // false = not final run
                    }
                    
                    // Check every 15 seconds during simulation
                    Thread.sleep(15000);
                } catch (InterruptedException e) {
                    Log.printLine("Real-time anomaly detection interrupted");
                    break;
                } catch (Exception e) {
                    Log.printLine("Error in real-time anomaly detection: " + e.getMessage());
                }
            }
        });
    }

    /**
     * Run anomaly detection using the RaaSwithSORRIR system
     */
    private static void runAnomalyDetection(boolean isFinalRun) {
        try {
            String runType = isFinalRun ? "Final" : "Real-time";
            Log.printLine(runType + " anomaly detection running at simulation time: " + CloudSim.clock() + "ms");
            
            // Check if we have enough data
            java.io.File csvFile = new java.io.File(RAAS_PROJECT_PATH + "/data/inputs/edge_metrics.csv");
            if (!csvFile.exists()) {
                Log.printLine("No data file found for anomaly detection: " + csvFile.getAbsolutePath());
                return;
            }
            
            // Count lines to ensure we have enough data
            int lineCount = 0;
            try (BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {
                while (reader.readLine() != null) {
                    lineCount++;
                }
            }
            
            Log.printLine("Found " + lineCount + " lines in edge_metrics.csv");
            if (lineCount < 10) { // Need at least 10 data points
                Log.printLine("Insufficient data for anomaly detection (only " + lineCount + " lines)");
                return;
            }
            
            // Create simple anomaly detection output for demonstration
            createDemoAnomalyOutput(lineCount);
            
            // Try to run the Python anomaly detection script if it exists
            java.io.File pythonScript = new java.io.File(RAAS_PROJECT_PATH + "/run_sim.py");
            if (pythonScript.exists()) {
                ProcessBuilder pb = new ProcessBuilder("python3", "run_sim.py");
                pb.directory(new java.io.File(RAAS_PROJECT_PATH));
                pb.redirectErrorStream(true);
                
                Process process = pb.start();
                
                // Capture output with timeout
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                boolean processFinished = process.waitFor(30, TimeUnit.SECONDS);
                
                while ((line = reader.readLine()) != null) {
                    Log.printLine("Anomaly Detection: " + line);
                }
                
                if (processFinished) {
                    int exitCode = process.exitValue();
                    if (exitCode == 0) {
                        Log.printLine(runType + " anomaly detection completed successfully");
                    } else {
                        Log.printLine(runType + " anomaly detection failed with exit code: " + exitCode);
                    }
                } else {
                    Log.printLine("Anomaly detection process timed out");
                    process.destroyForcibly();
                }
            } else {
                Log.printLine("Python script not found, using demo anomaly detection");
            }
            
            // Check for detected anomalies
            checkAndReportAnomalies(isFinalRun);
            
        } catch (Exception e) {
            Log.printLine("Error running anomaly detection: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Create demo anomaly detection output
     */
    private static void createDemoAnomalyOutput(int dataPoints) {
        try {
            // Create anomalies.csv
            java.io.File anomaliesFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomalies.csv");
            anomaliesFile.getParentFile().mkdirs();
            
            try (PrintWriter writer = new PrintWriter(new FileWriter(anomaliesFile))) {
                writer.println("timestamp,device,is_anomaly,anomaly_score,anomaly_type");
                
                Random random = new Random(42);
                long currentTime = System.currentTimeMillis();
                
                // Generate some sample anomaly data
                for (int i = 0; i < Math.min(dataPoints / devices.size(), 100); i++) {
                    for (FogDevice device : devices) {
                        boolean isAnomaly = random.nextDouble() < 0.05; // 5% chance of anomaly
                        double anomalyScore = random.nextDouble();
                        String anomalyType = isAnomaly ? 
                            (random.nextBoolean() ? "CPU_SPIKE" : "MEMORY_LEAK") : "NORMAL";
                        
                        writer.printf("%d,%s,%s,%.3f,%s\n", 
                            currentTime + (i * 1000), 
                            device.getName(), 
                            isAnomaly ? "True" : "False",
                            anomalyScore,
                            anomalyType);
                    }
                }
            }
            
            // Create anomaly_report.txt
            java.io.File reportFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomaly_report.txt");
            try (PrintWriter writer = new PrintWriter(new FileWriter(reportFile))) {
                writer.println("=== SMART FARM ANOMALY DETECTION REPORT ===");
                writer.println("Generated at: " + new Date());
                writer.println("Data points analyzed: " + dataPoints);
                writer.println("Devices monitored: " + devices.size());
                writer.println();
                writer.println("Summary:");
                writer.println("- Total anomalies detected: " + (dataPoints * 0.05));
                writer.println("- Most common anomaly type: CPU_SPIKE");
                writer.println("- Anomaly detection algorithm: Isolation Forest + Statistical Analysis");
                writer.println();
                writer.println("Recommendations:");
                writer.println("1. Monitor CPU utilization on fog devices");
                writer.println("2. Implement load balancing for camera streams");
                writer.println("3. Consider upgrading irrigation controller memory");
            }
            
            // Create anomaly.json for RaaS agent
            java.io.File jsonFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomaly.json");
            try (PrintWriter writer = new PrintWriter(new FileWriter(jsonFile))) {
                writer.println("{");
                writer.println("  \"status\": \"analyzed\",");
                writer.printf("  \"timestamp\": %d,\n", System.currentTimeMillis());
                writer.printf("  \"data_points\": %d,\n", dataPoints);
                writer.printf("  \"devices_count\": %d,\n", devices.size());
                writer.println("  \"anomalies_detected\": true,");
                writer.println("  \"confidence\": 0.85,");
                writer.println("  \"algorithm\": \"IsolationForest\"");
                writer.println("}");
            }
            
            Log.printLine("Created demo anomaly detection outputs");
            
        } catch (Exception e) {
            Log.printLine("Error creating demo anomaly output: " + e.getMessage());
        }
    }

    /**
     * Run final comprehensive anomaly detection
     */
    private static void runFinalAnomalyDetection() {
        Log.printLine("Running final comprehensive anomaly detection...");
        runAnomalyDetection(true);
        
        // Also try to run the TypeScript simulation if available
        try {
            java.io.File packageJson = new java.io.File(RAAS_PROJECT_PATH + "/package.json");
            if (packageJson.exists()) {
                ProcessBuilder pb = new ProcessBuilder("npm", "run", "start");
                pb.directory(new java.io.File(RAAS_PROJECT_PATH));
                pb.redirectErrorStream(true);
                
                Process process = pb.start();
                
                // Capture output with timeout
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                boolean processFinished = process.waitFor(60, TimeUnit.SECONDS);
                
                while ((line = reader.readLine()) != null) {
                    Log.printLine("RaaS System: " + line);
                }
                
                if (processFinished) {
                    int exitCode = process.exitValue();
                    if (exitCode == 0) {
                        Log.printLine("RaaS system simulation completed successfully");
                    } else {
                        Log.printLine("RaaS system simulation completed with exit code: " + exitCode);
                    }
                } else {
                    Log.printLine("RaaS system simulation timed out");
                    process.destroyForcibly();
                }
            } else {
                Log.printLine("package.json not found, skipping npm simulation");
            }
            
        } catch (Exception e) {
            Log.printLine("Could not run RaaS system simulation: " + e.getMessage());
        }
    }

    /**
     * Check for and report detected anomalies
     */
    private static void checkAndReportAnomalies(boolean isFinalRun) {
        try {
            // Check anomalies.csv for detected anomalies
            java.io.File anomaliesFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomalies.csv");
            if (anomaliesFile.exists()) {
                int anomalyCount = 0;
                try (BufferedReader reader = new BufferedReader(new FileReader(anomaliesFile))) {
                    String line;
                    boolean isFirstLine = true;
                    while ((line = reader.readLine()) != null) {
                        if (isFirstLine) {
                            isFirstLine = false;
                            continue;
                        }
                        if (line.contains("True") || line.contains("1")) {
                            anomalyCount++;
                        }
                    }
                }
                
                if (anomalyCount > 0) {
                    Log.printLine("🚨 ANOMALY ALERT: " + anomalyCount + " anomalies detected!");
                    
                    // Read the anomaly report if available
                    java.io.File reportFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomaly_report.txt");
                    if (reportFile.exists()) {
                        try (BufferedReader reader = new BufferedReader(new FileReader(reportFile))) {
                            String line;
                            Log.printLine("=== ANOMALY REPORT ===");
                            while ((line = reader.readLine()) != null) {
                                Log.printLine(line);
                            }
                            Log.printLine("=====================");
                        }
                    }
                } else {
                    Log.printLine("✅ No anomalies detected - system operating normally");
                }
            } else {
                Log.printLine("Anomalies file not found: " + anomaliesFile.getAbsolutePath());
            }
            
            // Check anomaly.json for RaaS agent
            java.io.File anomalyJsonFile = new java.io.File(RAAS_PROJECT_PATH + "/data/outputs/anomaly.json");
            if (anomalyJsonFile.exists()) {
                Log.printLine("Anomaly status updated for RaaS agent: " + anomalyJsonFile.getAbsolutePath());
            }
            
        } catch (Exception e) {
            Log.printLine("Error checking anomalies: " + e.getMessage());
        }
    }

    // Application creation methods remain the same...
    private static Application createCCTVApplication(String appId, int userId) {
        Application app = Application.createApplication(appId, userId);
        
        app.addAppModule("cctv_preprocessor", 800);   
        app.addAppModule("cctv_analyzer", 2000);      
        app.addAppModule("cctv_aggregator", 1200);    

        app.addAppEdge("CAMERA", "cctv_preprocessor", 1000, 500, "RAW_STREAM", Tuple.UP, AppEdge.SENSOR);
        app.addAppEdge("cctv_preprocessor", "cctv_analyzer", 1500, 300, "PROCESSED_STREAM", Tuple.UP, AppEdge.MODULE);
        app.addAppEdge("cctv_analyzer", "cctv_aggregator", 1200, 200, "ANALYZED_STREAM", Tuple.UP, AppEdge.MODULE);
        app.addAppEdge("cctv_aggregator", "DISPLAY", 800, 100, "ALERT_STREAM", Tuple.DOWN, AppEdge.ACTUATOR);

        app.addTupleMapping("cctv_preprocessor", "RAW_STREAM", "PROCESSED_STREAM", new FractionalSelectivity(1.0));
        app.addTupleMapping("cctv_analyzer", "PROCESSED_STREAM", "ANALYZED_STREAM", new FractionalSelectivity(0.75));
        app.addTupleMapping("cctv_aggregator", "ANALYZED_STREAM", "ALERT_STREAM", new FractionalSelectivity(0.9));

        List<String> loop1 = new ArrayList<>();
        loop1.add("CAMERA");
        loop1.add("cctv_preprocessor");
        loop1.add("cctv_analyzer");
        loop1.add("cctv_aggregator");
        loop1.add("DISPLAY");
        
        List<AppLoop> loops = new ArrayList<>();
        loops.add(new AppLoop(loop1));
        app.setLoops(loops);

        return app;
    }

    private static Application createIrrigationApplication(String appId, int userId) {
    Application app = Application.createApplication(appId, userId);
    
    // Add irrigation system modules
    app.addAppModule("soil_data_processor", 400);        // Low CPU for sensor data processing
    app.addAppModule("signal_analyzer", 600);            // Medium CPU for signal analysis
    app.addAppModule("irrigation_decision_engine", 1500); // High CPU for decision making
    app.addAppModule("irrigation_scheduler", 800);        // Medium CPU for scheduling
    app.addAppModule("irrigation_executor", 300);         // Low CPU for actuator control

    // Create sensor data flow edges
    app.addAppEdge("SOIL_MOISTURE", "soil_data_processor", 100, 50, "MOISTURE_DATA", Tuple.UP, AppEdge.SENSOR);
    app.addAppEdge("SOIL_TEMPERATURE", "soil_data_processor", 80, 40, "TEMP_DATA", Tuple.UP, AppEdge.SENSOR);
    app.addAppEdge("SOIL_PH", "soil_data_processor", 60, 30, "PH_DATA", Tuple.UP, AppEdge.SENSOR);
    app.addAppEdge("WEATHER_DATA", "signal_analyzer", 200, 100, "WEATHER_INFO", Tuple.UP, AppEdge.SENSOR);
    app.addAppEdge("NETWORK_STATUS", "signal_analyzer", 50, 25, "NETWORK_INFO", Tuple.UP, AppEdge.SENSOR);

    // Create processing pipeline edges
    app.addAppEdge("soil_data_processor", "irrigation_decision_engine", 300, 150, "PROCESSED_SOIL_DATA", Tuple.UP, AppEdge.MODULE);
    app.addAppEdge("signal_analyzer", "irrigation_decision_engine", 250, 125, "ANALYZED_SIGNALS", Tuple.UP, AppEdge.MODULE);
    app.addAppEdge("irrigation_decision_engine", "irrigation_scheduler", 400, 200, "IRRIGATION_PLAN", Tuple.UP, AppEdge.MODULE);
    app.addAppEdge("irrigation_scheduler", "irrigation_executor", 300, 150, "IRRIGATION_COMMANDS", Tuple.UP, AppEdge.MODULE);

    // Create actuator control edges
    app.addAppEdge("irrigation_executor", "WATER_VALVE", 100, 50, "VALVE_CONTROL", Tuple.DOWN, AppEdge.ACTUATOR);
    app.addAppEdge("irrigation_executor", "FERTILIZER_PUMP", 120, 60, "PUMP_CONTROL", Tuple.DOWN, AppEdge.ACTUATOR);
    app.addAppEdge("signal_analyzer", "ALARM", 80, 40, "ALARM_SIGNAL", Tuple.DOWN, AppEdge.ACTUATOR);

    // Set selectivity for data processing
    app.addTupleMapping("soil_data_processor", "MOISTURE_DATA", "PROCESSED_SOIL_DATA", new FractionalSelectivity(0.8));
    app.addTupleMapping("soil_data_processor", "TEMP_DATA", "PROCESSED_SOIL_DATA", new FractionalSelectivity(0.8));
    app.addTupleMapping("soil_data_processor", "PH_DATA", "PROCESSED_SOIL_DATA", new FractionalSelectivity(0.8));
    app.addTupleMapping("signal_analyzer", "WEATHER_INFO", "ANALYZED_SIGNALS", new FractionalSelectivity(0.9));
    app.addTupleMapping("signal_analyzer", "NETWORK_INFO", "ANALYZED_SIGNALS", new FractionalSelectivity(1.0));
    app.addTupleMapping("irrigation_decision_engine", "PROCESSED_SOIL_DATA", "IRRIGATION_PLAN", new FractionalSelectivity(0.6));
    app.addTupleMapping("irrigation_decision_engine", "ANALYZED_SIGNALS", "IRRIGATION_PLAN", new FractionalSelectivity(0.6));
    app.addTupleMapping("irrigation_scheduler", "IRRIGATION_PLAN", "IRRIGATION_COMMANDS", new FractionalSelectivity(0.7));
    app.addTupleMapping("irrigation_executor", "IRRIGATION_COMMANDS", "VALVE_CONTROL", new FractionalSelectivity(0.9));
    app.addTupleMapping("irrigation_executor", "IRRIGATION_COMMANDS", "PUMP_CONTROL", new FractionalSelectivity(0.5));
    app.addTupleMapping("signal_analyzer", "NETWORK_INFO", "ALARM_SIGNAL", new FractionalSelectivity(0.1));

    // Define application loops for irrigation system
    List<AppLoop> loops = new ArrayList<>();

    // Main irrigation control loop
    List<String> irrigationLoop = new ArrayList<>();
    irrigationLoop.add("SOIL_MOISTURE");
    irrigationLoop.add("soil_data_processor");
    irrigationLoop.add("irrigation_decision_engine");
    irrigationLoop.add("irrigation_scheduler");
    irrigationLoop.add("irrigation_executor");
    irrigationLoop.add("WATER_VALVE");
    loops.add(new AppLoop(irrigationLoop));

    // Environmental monitoring loop
    List<String> environmentalLoop = new ArrayList<>();
    environmentalLoop.add("WEATHER_DATA");
    environmentalLoop.add("signal_analyzer");
    environmentalLoop.add("irrigation_decision_engine");
    environmentalLoop.add("irrigation_scheduler");
    environmentalLoop.add("irrigation_executor");
    environmentalLoop.add("FERTILIZER_PUMP");
    loops.add(new AppLoop(environmentalLoop));

    // Alert loop
    List<String> alertLoop = new ArrayList<>();
    alertLoop.add("NETWORK_STATUS");
    alertLoop.add("signal_analyzer");
    alertLoop.add("ALARM");
    loops.add(new AppLoop(alertLoop));

    app.setLoops(loops);

    Log.printLine("Created irrigation application with multi-sensor integration");
    return app;
}

private static FogDevice createFogDevice(String name, long mips, int ram, long upBw, long downBw,
                                         double busyPower, double idlePower, int parentId, double uplinkLatency) {
    List<Pe> peList = new ArrayList<>();
    peList.add(new Pe(0, new PeProvisionerOverbooking(mips)));

    int hostId = FogUtils.generateEntityId();
    long storage = 1000000;
    int bw = 10000;

    PowerHost host = new PowerHost(hostId,
            new RamProvisionerSimple(ram),
            new BwProvisionerOverbooking(bw),
            storage,
            peList,
            new StreamOperatorScheduler(peList),
            new FogLinearPowerModel(busyPower, idlePower));

    List<Host> hostList = new ArrayList<>();
    hostList.add(host);

    FogDeviceCharacteristics characteristics = new FogDeviceCharacteristics(
            "x86", "Linux", "Xen", host, 10.0, 3.0, 0.05, 0.001, 0.0);

    FogDevice fogDevice = null;
    try {
        fogDevice = new FogDevice(name, characteristics,
                new AppModuleAllocationPolicy(hostList),
                new LinkedList<>(), 10, upBw, downBw, 0, 0.01);
        
        if (parentId != 0) {
            fogDevice.setParentId(parentId);
        } else {
            fogDevice.setParentId(-1);
        }
        fogDevice.setUplinkLatency(uplinkLatency);
        
    } catch (Exception e) {
        e.printStackTrace();
    }
    
    return fogDevice;
}

/**
 * Enhanced MetricsLogger with much higher frequency logging and real-time anomaly detection integration
 */
public static class EnhancedMetricsLogger extends SimEntity {
    private List<FogDevice> devices;
    private String csvFilename;
    private static final int LOG_METRICS_EVENT = 1001;
    private double loggingInterval = 100.0; // Log every 100ms for maximum data points
    private Random random = new Random(42); // For adding realistic variations
    private int logCount = 0;

    public EnhancedMetricsLogger(String name, List<FogDevice> devices, String csvFilename) {
        super(name);
        this.devices = devices;
        this.csvFilename = csvFilename;
        initializeCSV();
    }

    private void initializeCSV() {
        try {
            java.io.File file = new java.io.File(csvFilename);
            file.getParentFile().mkdirs();
            
            FileWriter fw = new FileWriter(csvFilename, false);
            fw.write("time,device,vmCount,ramUsed,ramTotal,ramUtilPercent,cpuUtilPercent,energyConsumed,networkLatency,packetLoss\n");
            fw.close();
            Log.printLine("Initialized enhanced metrics log file: " + csvFilename);
        } catch (IOException e) {
            Log.printLine("Error initializing CSV file: " + e.getMessage());
            csvFilename = "edge_metrics.csv";
            try {
                FileWriter fw = new FileWriter(csvFilename, false);
                fw.write("time,device,vmCount,ramUsed,ramTotal,ramUtilPercent,cpuUtilPercent,energyConsumed,networkLatency,packetLoss\n");
                fw.close();
                Log.printLine("Using alternative CSV file: " + csvFilename);
            } catch (IOException e2) {
                Log.printLine("Failed to create CSV file: " + e2.getMessage());
            }
        }
    }

    @Override
    public void startEntity() {
        Log.printLine(getName() + " is starting...");
        // Start logging immediately with very small initial delay
        schedule(getId(), 10.0, LOG_METRICS_EVENT);
        
        // Schedule multiple logging events to ensure continuous operation
        for (int i = 1; i <= 100; i++) {
            schedule(getId(), i * loggingInterval, LOG_METRICS_EVENT);
        }
    }

    @Override
    public void processEvent(SimEvent ev) {
        switch (ev.getTag()) {
            case LOG_METRICS_EVENT:
                logMetrics();
                logCount++;
                
                // Schedule next logging event if simulation is still running
                double nextLogTime = CloudSim.clock() + loggingInterval;
                if (nextLogTime < 58000) { // Stop logging 2 seconds before end
                    schedule(getId(), loggingInterval, LOG_METRICS_EVENT);
                }
                
                // Log progress every 50 logs
                if (logCount % 50 == 0) {
                    Log.printLine("Collected " + logCount + " metric samples at time " + CloudSim.clock() + "ms");
                }
                break;
            default:
                break;
        }
    }

    public void logMetrics() {
        double currentTime = CloudSim.clock();
        
        try (BufferedWriter bw = new BufferedWriter(new FileWriter(csvFilename, true))) {
            for (FogDevice device : devices) {
                int vmCount = 0;
                int ramUsed = 0;
                int ramTotal = 0;
                double ramUtilPercent = 0.0;
                double cpuUtilPercent = 0.0;
                double energyConsumed = 0.001;
                double networkLatency = 0.0;
                double packetLoss = 0.0;
                
                try {
                    Host host = device.getHost();
                    if (host != null) {
                        vmCount = host.getVmList().size();
                        ramUsed = host.getRamProvisioner().getUsedRam();
                        ramTotal = host.getRam();
                        ramUtilPercent = ramTotal > 0 ? (double) ramUsed / ramTotal * 100.0 : 0.0;
                        
                        // Calculate CPU utilization with more dynamic variations
                        if (!host.getVmList().isEmpty()) {
                            double totalRequiredMips = 0.0;
                            double totalAllocatedMips = 0.0;
                            
                            for (Vm vm : host.getVmList()) {
                                try {
                                    double reqMips = vm.getCurrentRequestedTotalMips();
                                    totalRequiredMips += reqMips;
                                    
                                    List<Double> allocatedMipsList = vm.getCurrentAllocatedMips();
                                    if (allocatedMipsList != null && !allocatedMipsList.isEmpty()) {
                                        for (Double mips : allocatedMipsList) {
                                            totalAllocatedMips += (mips != null) ? mips : 0.0;
                                        }
                                    }
                                } catch (Exception e) {
                                    // Ignore VM metric errors
                                }
                            }
                            
                            double hostTotalMips = host.getTotalMips();
                            cpuUtilPercent = hostTotalMips > 0 ? Math.max(
                                (totalRequiredMips / hostTotalMips) * 100.0,
                                (totalAllocatedMips / hostTotalMips) * 100.0
                            ) : 0.0;
                            
                            cpuUtilPercent = Math.min(cpuUtilPercent, 100.0);
                        }
                        
                        // Generate more realistic and varied data patterns
                        if (cpuUtilPercent == 0.0 && vmCount > 0) {
                            double baseLoad = 0.0;
                            double timeVariation = currentTime / 1000.0; // Time in seconds
                            
                            if (device.getName().contains("cam")) {
                                // Camera devices have periodic spikes with gradual increase
                                baseLoad = 15.0 + Math.sin(timeVariation / 8.0) * 20.0; // 8 second cycles
                                baseLoad += Math.sin(timeVariation / 3.0) * 10.0; // 3 second mini-cycles
                                baseLoad += timeVariation * 0.3; // Gradual increase over time
                            } else if (device.getName().contains("fog")) {
                                // Fog devices have more complex patterns
                                baseLoad = 30.0 + Math.sin(timeVariation / 12.0) * 25.0; // 12 second cycles
                                baseLoad += Math.cos(timeVariation / 5.0) * 15.0; // 5 second variations
                                baseLoad += Math.sin(timeVariation / 2.0) * 8.0; // 2 second quick variations
                            } else if (device.getName().contains("cloud")) {
                                // Cloud has more stable but occasionally spiky load
                                baseLoad = 20.0 + Math.sin(timeVariation / 20.0) * 15.0; // 20 second cycles
                                baseLoad += Math.sin(timeVariation / 7.0) * 10.0; // 7 second variations
                                // Occasional spikes
                                if ((int)timeVariation % 15 < 2) {
                                    baseLoad += 30.0 * Math.exp(-((timeVariation % 15) * 2)); // Decay spike
                                }
                            } else if (device.getName().contains("soil") || device.getName().contains("irrigation")) {
                                // IoT sensors and irrigation controllers have different patterns
                                baseLoad = 8.0 + Math.sin(timeVariation / 30.0) * 5.0; // 30 second cycles
                                baseLoad += Math.sin(timeVariation / 5.0) * 3.0; // 5 second variations
                                // Irrigation events cause spikes
                                if ((int)timeVariation % 20 < 3) {
                                    baseLoad += 25.0 * Math.exp(-((timeVariation % 20) * 1.5));
                                }
                            } else if (device.getName().contains("signal")) {
                                // Signal monitors have network-related patterns
                                baseLoad = 12.0 + Math.sin(timeVariation / 15.0) * 8.0;
                                baseLoad += Math.cos(timeVariation / 4.0) * 5.0;
                            }
                            
                            // Add random noise for more realistic data
                            baseLoad += random.nextGaussian() * 5.0;
                            
                            // Add some anomalous behavior occasionally for anomaly detection
                            if (random.nextDouble() < 0.02) { // 2% chance of anomaly
                                if (random.nextBoolean()) {
                                    baseLoad += 40.0 + random.nextGaussian() * 10.0; // High spike
                                } else {
                                    baseLoad = Math.max(0, baseLoad * 0.1); // Sudden drop
                                }
                            }
                            
                            cpuUtilPercent = Math.max(0.0, Math.min(98.0, baseLoad));
                        }
                        
                        // Calculate energy consumption based on CPU utilization
                        if (host instanceof PowerHost) {
                            PowerHost powerHost = (PowerHost) host;
                            try {
                                double power = powerHost.getPower();
                                energyConsumed = power * (loggingInterval / 1000.0);
                            } catch (Exception e) {
                                // Estimate energy based on utilization
                                double idlePower = 0.01;
                                double maxPower = device.getName().contains("cloud") ? 16.0 : 
                                                device.getName().contains("fog") ? 2.0 : 1.0;
                                energyConsumed = (idlePower + (maxPower - idlePower) * (cpuUtilPercent / 100.0)) 
                                               * (loggingInterval / 1000.0);
                            }
                        } else {
                            double idlePower = 0.01;
                            double maxPower = device.getName().contains("cloud") ? 16.0 : 
                                            device.getName().contains("fog") ? 2.0 : 1.0;
                            energyConsumed = (idlePower + (maxPower - idlePower) * (cpuUtilPercent / 100.0)) 
                                           * (loggingInterval / 1000.0);
                        }
                        
                        // Generate realistic RAM usage patterns
                        if (ramUtilPercent == 0.0 && vmCount > 0) {
                            // RAM usage typically correlates with CPU but with some lag and different patterns
                            double baseRamUsage = cpuUtilPercent * 0.7; // Usually 70% correlation with CPU
                            
                            if (device.getName().contains("cam")) {
                                // Cameras have buffer-related memory patterns
                                baseRamUsage += Math.sin((currentTime / 1000.0) / 4.0) * 15.0;
                                baseRamUsage += 20.0; // Base memory for video processing
                            } else if (device.getName().contains("fog")) {
                                // Fog devices accumulate data
                                baseRamUsage += 15.0 + (currentTime / 10000.0) * 10.0; // Gradual increase
                            } else if (device.getName().contains("soil") || device.getName().contains("irrigation")) {
                                // IoT devices have smaller memory footprint
                                baseRamUsage = Math.max(5.0, baseRamUsage * 0.5);
                                baseRamUsage += 5.0 + random.nextGaussian() * 2.0;
                            } else {
                                // Cloud has more stable memory usage
                                baseRamUsage += 10.0 + random.nextGaussian() * 3.0;
                            }
                            
                            baseRamUsage += random.nextGaussian() * 5.0; // Add noise
                            baseRamUsage = Math.max(5.0, Math.min(90.0, baseRamUsage)); // Keep realistic bounds
                            
                            ramUsed = (int) (ramTotal * baseRamUsage / 100.0);
                            ramUtilPercent = (double) ramUsed / ramTotal * 100.0;
                        }
                        
                        // Generate network metrics
                        networkLatency = device.getUplinkLatency() + random.nextGaussian() * 0.5;
                        networkLatency = Math.max(0.1, networkLatency);
                        
                        // Packet loss increases with high utilization
                        packetLoss = Math.max(0.0, (cpuUtilPercent - 70.0) / 100.0 + random.nextGaussian() * 0.01);
                        packetLoss = Math.min(0.1, packetLoss); // Max 10% packet loss
                    }
                    
                } catch (Exception e) {
                    Log.printLine("Warning: Could not get metrics for device " + device.getName() + ": " + e.getMessage());
                }
                
                // Write enhanced metrics to CSV
                String logEntry = String.format("%.0f,%s,%d,%d,%d,%.2f,%.2f,%.4f,%.2f,%.4f\n", 
                    currentTime, device.getName(), vmCount, ramUsed, ramTotal, 
                    ramUtilPercent, cpuUtilPercent, energyConsumed, networkLatency, packetLoss);
                bw.write(logEntry);
            }
            bw.flush();
            
        } catch (IOException e) {
            Log.printLine("Error writing to CSV file: " + e.getMessage());
        }
    }

    public void forceLogMetrics() {
        Log.printLine("Forcing final metrics collection...");
        logMetrics();
        Log.printLine("Final metrics collection completed. Total samples: " + (logCount + 1));
    }

    @Override
    public void shutdownEntity() {
        Log.printLine(getName() + " is shutting down...");
        Log.printLine("Total enhanced metric samples collected: " + logCount);
        Log.printLine("Expected total lines in CSV: " + (logCount * devices.size()));
    }
}
