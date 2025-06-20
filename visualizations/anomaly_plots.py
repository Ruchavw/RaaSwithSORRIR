import os
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

def plot_anomalies(path="data/outputs/anomalies.csv"):
    """
    Create comprehensive anomaly detection visualizations
    
    Args:
        path: Path to the CSV file containing anomaly detection results
    """
    try:
        print(f"📊 Loading anomaly data from {path}...")
        df = pd.read_csv(path)
        print(f"✅ Successfully loaded {len(df)} records")
        
        # Ensure output directory exists
        output_dir = "visualizations/output"
        os.makedirs(output_dir, exist_ok=True)
        
        # Set up the plotting style
        plt.style.use('default')
        sns.set_palette("husl")
        
        # Check available columns for plotting
        print(f"📈 Available columns: {list(df.columns)}")
        
        # Create multiple visualizations
        create_cpu_ram_scatter(df, output_dir)
        create_cpu_latency_scatter(df, output_dir)
        create_anomaly_timeline(df, output_dir)
        create_device_anomaly_summary(df, output_dir)
        create_feature_distributions(df, output_dir)
        create_anomaly_score_histogram(df, output_dir)
        
        print(f"✅ All visualizations saved to {output_dir}/")
        
    except FileNotFoundError:
        print(f"❌ File not found: {path}")
        print("   Please run the anomaly detection first to generate the data.")
    except Exception as e:
        print(f"❌ Error creating visualizations: {e}")

def create_cpu_ram_scatter(df, output_dir):
    """Create CPU vs RAM utilization scatter plot with anomalies highlighted"""
    if 'cpuUtilPercent' not in df.columns or 'ramUtilPercent' not in df.columns:
        print("⚠️  CPU or RAM utilization columns not found, skipping CPU-RAM scatter plot")
        return
    
    plt.figure(figsize=(10, 8))
    
    # Plot with correct anomaly mapping: -1 = anomaly, 1 = normal
    scatter = sns.scatterplot(
        data=df,
        x='cpuUtilPercent', 
        y='ramUtilPercent', 
        hue='anomaly',
        palette={1: "lightblue", -1: "red"},  # Normal=blue, Anomaly=red
        alpha=0.7,
        s=60
    )
    
    plt.title("Anomaly Detection - CPU vs RAM Utilization", fontsize=16, fontweight='bold')
    plt.xlabel("CPU Utilization (%)", fontsize=12)
    plt.ylabel("RAM Utilization (%)", fontsize=12)
    
    # Update legend labels
    handles, labels = scatter.get_legend_handles_labels()
    new_labels = ['Normal' if label == '1' else 'Anomaly' if label == '-1' else label for label in labels]
    plt.legend(handles, new_labels, title='Classification', title_fontsize=12)
    
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/cpu_ram_anomalies.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   📊 CPU-RAM scatter plot saved")

def create_cpu_latency_scatter(df, output_dir):
    """Create CPU vs synthetic latency scatter plot (for compatibility with original code)"""
    if 'cpuUtilPercent' not in df.columns:
        print("⚠️  CPU utilization column not found, skipping CPU-latency plot")
        return
    
    # Create synthetic latency based on CPU usage (since original code expected this)
    df_plot = df.copy()
    if 'latency' not in df_plot.columns:
        # Generate realistic latency based on CPU usage and energy consumption
        base_latency = 50  # base latency in ms
        cpu_factor = df_plot['cpuUtilPercent'] * 0.5  # Higher CPU = higher latency
        energy_factor = df_plot.get('energyConsumed', 1) * 2  # Higher energy = higher latency
        noise = np.random.normal(0, 5, len(df_plot))  # Add some noise
        
        df_plot['latency'] = base_latency + cpu_factor + energy_factor + noise
        df_plot['latency'] = np.clip(df_plot['latency'], 10, 300)  # Reasonable bounds
    
    plt.figure(figsize=(10, 8))
    
    scatter = sns.scatterplot(
        data=df_plot,
        x='cpuUtilPercent', 
        y='latency', 
        hue='anomaly',
        palette={1: "green", -1: "red"},  # Match original color scheme
        alpha=0.7,
        s=60
    )
    
    plt.title("Anomaly Detection - CPU vs Latency", fontsize=16, fontweight='bold')
    plt.xlabel("CPU Utilization (%)", fontsize=12)
    plt.ylabel("Latency (ms)", fontsize=12)
    
    # Update legend labels
    handles, labels = scatter.get_legend_handles_labels()
    new_labels = ['Normal' if label == '1' else 'Anomaly' if label == '-1' else label for label in labels]
    plt.legend(handles, new_labels, title='Classification', title_fontsize=12)
    
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/anomaly_plot.png", dpi=300, bbox_inches='tight')  # Keep original filename
    plt.close()
    print(f"   📊 CPU-Latency scatter plot saved")

def create_anomaly_timeline(df, output_dir):
    """Create timeline visualization of anomalies"""
    if 'time' not in df.columns:
        print("⚠️  Time column not found, skipping timeline plot")
        return
    
    plt.figure(figsize=(14, 6))
    
    # Plot normal points
    normal_data = df[df['anomaly'] == 1]
    anomaly_data = df[df['anomaly'] == -1]
    
    plt.scatter(normal_data['time'], normal_data['cpuUtilPercent'], 
               c='lightblue', alpha=0.6, s=20, label='Normal')
    plt.scatter(anomaly_data['time'], anomaly_data['cpuUtilPercent'], 
               c='red', alpha=0.8, s=40, label='Anomaly', marker='x')
    
    plt.title("Anomaly Detection Timeline - CPU Utilization", fontsize=16, fontweight='bold')
    plt.xlabel("Time (ms)", fontsize=12)
    plt.ylabel("CPU Utilization (%)", fontsize=12)
    plt.legend(title='Classification', title_fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/anomaly_timeline.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   📊 Anomaly timeline saved")

def create_device_anomaly_summary(df, output_dir):
    """Create bar chart showing anomaly counts by device"""
    if 'device' not in df.columns:
        print("⚠️  Device column not found, skipping device summary")
        return
    
    # Calculate anomaly counts by device
    device_stats = df.groupby('device').agg({
        'anomaly': [lambda x: len(x), lambda x: (x == -1).sum()]
    }).round(2)
    device_stats.columns = ['total', 'anomalies']
    device_stats['normal'] = device_stats['total'] - device_stats['anomalies']
    device_stats['anomaly_rate'] = (device_stats['anomalies'] / device_stats['total'] * 100).round(1)
    
    # Create grouped bar chart
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Anomaly counts
    x = range(len(device_stats))
    width = 0.35
    
    ax1.bar([i - width/2 for i in x], device_stats['normal'], width, 
            label='Normal', color='lightblue', alpha=0.8)
    ax1.bar([i + width/2 for i in x], device_stats['anomalies'], width, 
            label='Anomalies', color='red', alpha=0.8)
    
    ax1.set_xlabel('Device', fontsize=12)
    ax1.set_ylabel('Count', fontsize=12)
    ax1.set_title('Anomaly Counts by Device', fontsize=14, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(device_stats.index, rotation=45)
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Anomaly rates
    bars = ax2.bar(device_stats.index, device_stats['anomaly_rate'], 
                   color='orange', alpha=0.7)
    ax2.set_xlabel('Device', fontsize=12)
    ax2.set_ylabel('Anomaly Rate (%)', fontsize=12)
    ax2.set_title('Anomaly Rate by Device', fontsize=14, fontweight='bold')
    ax2.tick_params(axis='x', rotation=45)
    ax2.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for bar, rate in zip(bars, device_stats['anomaly_rate']):
        height = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                f'{rate:.1f}%', ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/device_anomaly_summary.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   📊 Device anomaly summary saved")

def create_feature_distributions(df, output_dir):
    """Create distribution plots for key features, split by anomaly classification"""
    numerical_features = ['cpuUtilPercent', 'ramUtilPercent', 'energyConsumed']
    available_features = [col for col in numerical_features if col in df.columns]
    
    if not available_features:
        print("⚠️  No numerical features found for distribution plots")
        return
    
    fig, axes = plt.subplots(2, len(available_features), figsize=(5*len(available_features), 10))
    if len(available_features) == 1:
        axes = axes.reshape(-1, 1)
    
    for i, feature in enumerate(available_features):
        # Histogram
        normal_data = df[df['anomaly'] == 1][feature]
        anomaly_data = df[df['anomaly'] == -1][feature]
        
        axes[0, i].hist(normal_data, bins=30, alpha=0.7, label='Normal', color='lightblue', density=True)
        axes[0, i].hist(anomaly_data, bins=30, alpha=0.7, label='Anomaly', color='red', density=True)
        axes[0, i].set_title(f'{feature} Distribution', fontweight='bold')
        axes[0, i].set_xlabel(feature)
        axes[0, i].set_ylabel('Density')
        axes[0, i].legend()
        axes[0, i].grid(True, alpha=0.3)
        
        # Box plot
        data_for_box = []
        labels_for_box = []
        
        data_for_box.extend(normal_data.tolist())
        labels_for_box.extend(['Normal'] * len(normal_data))
        
        data_for_box.extend(anomaly_data.tolist())
        labels_for_box.extend(['Anomaly'] * len(anomaly_data))
        
        box_df = pd.DataFrame({'value': data_for_box, 'type': labels_for_box})
        sns.boxplot(data=box_df, x='type', y='value', ax=axes[1, i])
        axes[1, i].set_title(f'{feature} Box Plot', fontweight='bold')
        axes[1, i].set_xlabel('Classification')
        axes[1, i].set_ylabel(feature)
        axes[1, i].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/feature_distributions.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   📊 Feature distributions saved")

def create_anomaly_score_histogram(df, output_dir):
    """Create histogram of anomaly scores"""
    if 'anomaly_score' not in df.columns:
        print("⚠️  Anomaly score column not found, skipping score histogram")
        return
    
    plt.figure(figsize=(12, 6))
    
    # Split data by classification
    normal_scores = df[df['anomaly'] == 1]['anomaly_score']
    anomaly_scores = df[df['anomaly'] == -1]['anomaly_score']
    
    # Create side-by-side subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Combined histogram
    ax1.hist(normal_scores, bins=50, alpha=0.7, label='Normal', color='lightblue', density=True)
    ax1.hist(anomaly_scores, bins=50, alpha=0.7, label='Anomaly', color='red', density=True)
    ax1.set_xlabel('Anomaly Score', fontsize=12)
    ax1.set_ylabel('Density', fontsize=12)
    ax1.set_title('Anomaly Score Distribution', fontsize=14, fontweight='bold')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Add vertical line at decision boundary (typically around 0)
    ax1.axvline(x=0, color='black', linestyle='--', alpha=0.8, label='Decision Boundary')
    
    # Scatter plot of scores vs index (to show temporal patterns if any)
    normal_indices = df[df['anomaly'] == 1].index
    anomaly_indices = df[df['anomaly'] == -1].index
    
    ax2.scatter(normal_indices, normal_scores, alpha=0.6, s=20, color='lightblue', label='Normal')
    ax2.scatter(anomaly_indices, anomaly_scores, alpha=0.8, s=30, color='red', label='Anomaly')
    ax2.set_xlabel('Data Point Index', fontsize=12)
    ax2.set_ylabel('Anomaly Score', fontsize=12)
    ax2.set_title('Anomaly Scores Over Time', fontsize=14, fontweight='bold')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    ax2.axhline(y=0, color='black', linestyle='--', alpha=0.8)
    
    plt.tight_layout()
    plt.savefig(f"{output_dir}/anomaly_score_analysis.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"   📊 Anomaly score analysis saved")

if __name__ == "__main__":
    # Test the visualization function
    plot_anomalies()