import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import os

def run_anomaly_detection(input_path="data/inputs/edge_metrics.csv", output_path="data/outputs/anomalies.csv"):
    """
    Run Isolation Forest anomaly detection on edge computing metrics
    
    Args:
        input_path: Path to the CSV file containing edge metrics
        output_path: Path to save the results with anomaly scores
    """
    try:
        print(f"📊 Loading data from {input_path}...")
        data = pd.read_csv(input_path)
        print(f"✅ Successfully loaded {len(data)} records")
        
        # Display basic info about the dataset
        print(f"📈 Dataset shape: {data.shape}")
        print(f"🏷️  Columns: {list(data.columns)}")
        print(f"🔢 Devices found: {data['device'].unique()}")
        
    except FileNotFoundError:
        print("⚠️  Edge metrics file not found, generating synthetic data for testing.")
        data = simulate_edge_data()
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(input_path), exist_ok=True)
        data.to_csv(input_path, index=False)
        print(f"💾 Synthetic data saved to {input_path}")

    # Prepare features for anomaly detection
    print("🔧 Preprocessing data for anomaly detection...")
    
    # Select numerical features relevant for anomaly detection
    feature_columns = ['ramUsed', 'ramTotal', 'ramUtilPercent', 'cpuUtilPercent', 'energyConsumed']
    
    # Check if all required columns exist
    missing_cols = [col for col in feature_columns if col not in data.columns]
    if missing_cols:
        print(f"⚠️  Missing columns: {missing_cols}")
        print("Available columns:", list(data.columns))
        # Use available numerical columns
        numerical_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        if 'time' in numerical_cols:
            numerical_cols.remove('time')  # Remove time as it's not a feature
        feature_columns = numerical_cols
        print(f"🔄 Using available numerical columns: {feature_columns}")
    
    # Extract features
    features = data[feature_columns].copy()
    
    # Handle missing values
    if features.isnull().sum().sum() > 0:
        print("🔧 Handling missing values...")
        features = features.fillna(features.mean())
    
    # Scale features for better anomaly detection
    print("📏 Scaling features...")
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)
    
    # Configure and train Isolation Forest
    print("🌲 Training Isolation Forest model...")
    model = IsolationForest(
        n_estimators=100,           # Number of trees
        contamination=0.05,         # Expected proportion of anomalies (5%)
        random_state=42,            # For reproducibility
        max_samples='auto',         # Use all samples
        max_features=1.0,           # Use all features
        bootstrap=False,            # Don't bootstrap samples
        n_jobs=-1                   # Use all available cores
    )
    
    # Fit the model
    model.fit(features_scaled)
    
    # Generate predictions and scores
    print("🔍 Detecting anomalies...")
    predictions = model.predict(features_scaled)     # 1 = normal, -1 = anomaly
    scores = model.decision_function(features_scaled) # Higher = more normal
    
    # Add results to original dataframe
    data_with_results = data.copy()
    data_with_results['anomaly_score'] = scores
    data_with_results['anomaly'] = predictions
    data_with_results['is_anomaly'] = (predictions == -1)  # Boolean for easier filtering
    
    # Calculate anomaly statistics
    total_points = len(data_with_results)
    anomaly_count = (predictions == -1).sum()
    anomaly_percentage = (anomaly_count / total_points) * 100
    
    print(f"📊 Anomaly Detection Results:")
    print(f"   • Total data points: {total_points}")
    print(f"   • Anomalies detected: {anomaly_count}")
    print(f"   • Anomaly rate: {anomaly_percentage:.2f}%")
    
    # Show anomaly statistics by device
    if 'device' in data_with_results.columns:
        print(f"\n🖥️  Anomalies by device:")
        device_anomalies = data_with_results.groupby('device').agg({
            'is_anomaly': ['count', 'sum']
        }).round(2)
        device_anomalies.columns = ['total_points', 'anomalies']
        device_anomalies['anomaly_rate_%'] = (device_anomalies['anomalies'] / device_anomalies['total_points'] * 100).round(2)
        print(device_anomalies)
    
    # Save results
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data_with_results.to_csv(output_path, index=False)
    print(f"💾 Results saved to {output_path}")
    
    # Show some sample anomalies
    anomalies = data_with_results[data_with_results['is_anomaly'] == True]
    if len(anomalies) > 0:
        print(f"\n🚨 Sample anomalies (showing first 5):")
        sample_anomalies = anomalies.head()
        for idx, row in sample_anomalies.iterrows():
            print(f"   • Time: {row.get('time', 'N/A')}, Device: {row.get('device', 'N/A')}, "
                  f"CPU: {row.get('cpuUtilPercent', 'N/A'):.1f}%, "
                  f"RAM: {row.get('ramUtilPercent', 'N/A'):.1f}%, "
                  f"Score: {row['anomaly_score']:.3f}")
    
    print("✅ Anomaly detection completed successfully!")
    return data_with_results, model, scaler

def simulate_edge_data(n=1000):
    """
    Generate synthetic edge computing metrics data for testing
    """
    print("🔧 Generating synthetic edge computing data...")
    
    np.random.seed(42)
    
    # Create time series data
    time_points = np.arange(0, n * 100, 100)  # Every 100ms
    devices = ['cloud', 'fog-0', 'cam-1', 'cam-2']
    
    data_list = []
    
    for i, time in enumerate(time_points[:n//4]):  # Divide time points among devices
        for device in devices:
            # Generate realistic patterns based on device type
            if 'cam' in device:
                # Camera devices - moderate resource usage with spikes
                cpu_base = 25 + 15 * np.sin(time / 8000) + np.random.normal(0, 5)
                ram_total = 1000
                ram_base = cpu_base * 0.8 + np.random.normal(0, 5)
                energy_base = 0.5 + (cpu_base / 100) * 0.5
            elif 'fog' in device:
                # Fog devices - moderate to high usage
                cpu_base = 40 + 20 * np.sin(time / 12000) + np.random.normal(0, 8)
                ram_total = 4000
                ram_base = cpu_base * 0.7 + np.random.normal(0, 8)
                energy_base = 1.0 + (cpu_base / 100) * 1.0
            else:  # cloud
                # Cloud devices - variable load with occasional spikes
                cpu_base = 30 + 25 * np.sin(time / 20000) + np.random.normal(0, 10)
                ram_total = 40000
                ram_base = cpu_base * 0.6 + np.random.normal(0, 10)
                energy_base = 8.0 + (cpu_base / 100) * 8.0
            
            # Add anomalies (5% chance)
            if np.random.random() < 0.05:
                if np.random.random() < 0.5:
                    # High utilization anomaly
                    cpu_base += np.random.uniform(40, 60)
                    ram_base += np.random.uniform(30, 50)
                else:
                    # Low utilization anomaly
                    cpu_base *= 0.1
                    ram_base *= 0.2
            
            # Ensure realistic bounds
            cpu_util = np.clip(cpu_base, 0, 98)
            ram_util = np.clip(ram_base, 1, 95)
            ram_used = int(ram_total * ram_util / 100)
            
            data_list.append({
                'time': time,
                'device': device,
                'vmCount': np.random.randint(1, 4),
                'ramUsed': ram_used,
                'ramTotal': ram_total,
                'ramUtilPercent': ram_util,
                'cpuUtilPercent': cpu_util,
                'energyConsumed': max(0.001, energy_base * np.random.uniform(0.8, 1.2))
            })
    
    return pd.DataFrame(data_list)

if __name__ == "__main__":
    # Test the function
    run_anomaly_detection()