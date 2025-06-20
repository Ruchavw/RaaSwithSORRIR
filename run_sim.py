# run_sim.py - Enhanced simulation runner for edge computing anomaly detection

import os
import sys
import json
import pandas as pd
from pathlib import Path

# Add the current directory to Python path to import modules
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

def setup_directories():
    """Create necessary directories for the project"""
    directories = [
        "data/inputs",
        "data/outputs", 
        "visualizations/output",
        "models",
        "visualizations"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"📁 Created/verified directory: {directory}")

def check_input_data(input_path="data/inputs/edge_metrics.csv"):
    """Check if input data exists and display basic info"""
    print(f"\n🔍 Checking input data at {input_path}...")
    
    if os.path.exists(input_path):
        try:
            data = pd.read_csv(input_path)
            print(f"✅ Found input data with {len(data)} records")
            print(f"📊 Columns: {list(data.columns)}")
            
            if 'device' in data.columns:
                devices = data['device'].unique()
                print(f"🖥️  Devices: {list(devices)}")
                
                if 'time' in data.columns:
                    time_range = data['time'].max() - data['time'].min()
                    print(f"⏱️  Time range: {data['time'].min():.0f} to {data['time'].max():.0f} ms ({time_range/1000:.1f} seconds)")

            print(f"\n📋 Sample data (first 3 rows):")
            print(data.head(3).to_string(index=False))
            return True
        except Exception as e:
            print(f"❌ Error reading input data: {e}")
            return False
    else:
        print(f"⚠️  Input file not found at {input_path}")
        print("   The simulation will generate synthetic data for testing.")
        return False

def run_anomaly_detection_pipeline():
    print("🚀 Starting Edge Computing Anomaly Detection Pipeline...")
    print("=" * 60)
    
    setup_directories()
    input_path = "data/inputs/edge_metrics.csv"
    output_path = "data/outputs/anomalies.csv"
    check_input_data(input_path)

    try:
        print(f"\n🔬 Importing anomaly detection module...")
        from models.isolation_forest import run_anomaly_detection
        results, model, scaler = run_anomaly_detection(input_path=input_path, output_path=output_path)

        print(f"\n✅ Anomaly detection completed successfully!")

        try:
            print(f"\n📊 Generating visualizations...")
            from visualizations.anomaly_plots import plot_anomalies
            plot_anomalies(path=output_path)
            print(f"✅ Visualizations saved to visualizations/output/")
        except ImportError:
            print(f"⚠️  Visualization module not found. Creating basic analysis...")
            create_basic_analysis(results)
        except Exception as e:
            print(f"⚠️  Error generating visualizations: {e}")
            create_basic_analysis(results)

        # ✅ Write anomaly.json based on most recent anomaly
        try:
            anomaly_rows = results[results["is_anomaly"] == True]
            if not anomaly_rows.empty:
                latest_result = anomaly_rows.iloc[-1]
            else:
                latest_result = results.iloc[-1]

            is_anomaly = bool(latest_result["is_anomaly"])

            anomaly_summary = {
                "time": int(latest_result["time"]),
                "device": latest_result["device"],
                "is_anomaly": is_anomaly,
                "anomaly_score": float(latest_result["anomaly_score"])
            }

            with open("data/outputs/anomaly.json", "w") as f:
                json.dump(anomaly_summary, f, indent=2)

            print(f"✅ anomaly.json written → is_anomaly = {is_anomaly}")
        except Exception as e:
            print(f"⚠️ Failed to write anomaly.json: {e}")

    except ImportError as e:
        print(f"❌ Error importing modules: {e}")
        return False
    except Exception as e:
        print(f"❌ Error during anomaly detection: {e}")
        return False

    return True

def create_basic_analysis(results):
    print(f"📈 Creating basic analysis report...")
    try:
        total_points = len(results)
        anomaly_count = (results['anomaly'] == -1).sum()
        anomaly_rate = (anomaly_count / total_points) * 100

        report = f"""
Edge Computing Anomaly Detection Report
=====================================

Dataset Summary:
- Total data points: {total_points:,}
- Anomalies detected: {anomaly_count:,}
- Anomaly rate: {anomaly_rate:.2f}%

Anomaly Score Statistics:
- Mean score: {results['anomaly_score'].mean():.3f}
- Std deviation: {results['anomaly_score'].std():.3f}
- Min score: {results['anomaly_score'].min():.3f}
- Max score: {results['anomaly_score'].max():.3f}

"""

        if 'device' in results.columns:
            report += "Device-wise Anomaly Summary:\n"
            device_stats = results.groupby('device').agg({
                'anomaly': lambda x: (x == -1).sum(),
                'anomaly_score': ['mean', 'std', 'min', 'max']
            }).round(3)
            report += device_stats.to_string()
            report += "\n\n"

        anomalies = results[results['anomaly'] == -1].nlargest(5, 'anomaly_score')
        if len(anomalies) > 0:
            report += "Top 5 Anomalies (by score):\n"
            for idx, row in anomalies.iterrows():
                report += f"- Time: {row.get('time', 'N/A')}, Device: {row.get('device', 'N/A')}, Score: {row['anomaly_score']:.3f}\n"

        report_path = "data/outputs/anomaly_report.txt"
        with open(report_path, 'w') as f:
            f.write(report)

        print(f"📄 Analysis report saved to {report_path}")
        print(f"\n{report}")
    except Exception as e:
        print(f"⚠️  Error creating basic analysis: {e}")

def main():
    success = run_anomaly_detection_pipeline()
    if success:
        print(f"\n🎉 Pipeline completed successfully!")
        print(f"📁 Check:")
        print(f"   • data/outputs/anomalies.csv")
        print(f"   • data/outputs/anomaly_report.txt")
        print(f"   • data/outputs/anomaly.json ← RaaS input")
    else:
        print(f"\n❌ Pipeline failed. Please check the error messages.")
    print(f"\n" + "=" * 60)

if __name__ == "__main__":
    main()
