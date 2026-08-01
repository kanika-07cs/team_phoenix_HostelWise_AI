import os
import sys
import pandas as pd
import numpy as np
import joblib

# Use non-interactive backend for matplotlib to prevent GUI window popping crashes
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

# Classifiers
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

def log_message(msg):
    print(f"[ML PIPELINE] {msg}")

# Create output directories
os.makedirs("eda_plots", exist_ok=True)

# =====================================================================
# PHASE 1 – LOAD DATASET
# =====================================================================
log_message("Phase 1: Automatically locating and loading dataset...")

dataset_paths = [
    "HostelWiseAI_Dataset_1000 (1).csv",
    "../HostelWiseAI_Dataset_1000 (1).csv",
    "backend/HostelWiseAI_Dataset_1000 (1).csv"
]
df = None
for path in dataset_paths:
    if os.path.exists(path):
        log_message(f"Dataset detected at: {path}")
        df = pd.read_csv(path)
        break

if df is None:
    log_message("CRITICAL ERROR: HostelWiseAI_Dataset_1000 (1).csv could not be found.")
    sys.exit(1)

# Validate shape and columns
log_message(f"Dataset loaded. Shape: {df.shape}")
log_message(f"Number of features: {df.shape[1]}")

required_columns = [
    "timestamp", "hostel_id", "floor_no", "wing", "room_no", "room_capacity",
    "students_present", "students_outside", "students_on_leave", "is_weekend",
    "is_holiday", "hour_of_day", "temperature", "expected_energy_kwh",
    "actual_energy_kwh", "energy_difference", "anomaly"
]

missing_cols = [col for col in required_columns if col not in df.columns]
if missing_cols:
    log_message(f"CRITICAL ERROR: Required columns are missing from the dataset: {missing_cols}")
    sys.exit(1)

log_message("All required columns verified successfully.")

# Display stats summaries
print("\n--- FIRST 10 RECORDS ---")
print(df.head(10))
print("\n--- DATA TYPES ---")
print(df.dtypes)
print("\n--- STATISTICAL SUMMARY ---")
print(df.describe())
print("\n--- MISSING VALUE SUMMARY ---")
print(df.isnull().sum())
print("\n--- DUPLICATE RECORD SUMMARY ---")
print(f"Duplicates: {df.duplicated().sum()}")


# =====================================================================
# PHASE 2 – DATA CLEANING & PREPROCESSING
# =====================================================================
log_message("Phase 2: Cleaning and preprocessing...")

# Remove duplicates
duplicates_count = df.duplicated().sum()
if duplicates_count > 0:
    df = df.drop_duplicates()
    log_message(f"Removed {duplicates_count} duplicate records.")

# Validate Anomaly contains only 0 and 1
invalid_anomalies = df[~df['anomaly'].isin([0, 1])]
if not invalid_anomalies.empty:
    log_message("Warning: Anomaly column contains invalid values. Filtering out invalid entries.")
    df = df[df['anomaly'].isin([0, 1])]

# Convert timestamp to datetime format
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Feature Engineering
log_message("Phase 2: Performing feature engineering...")
df['year'] = df['timestamp'].dt.year
df['month'] = df['timestamp'].dt.month
df['day'] = df['timestamp'].dt.day
df['day_of_week_encoded'] = df['timestamp'].dt.dayofweek # Monday=0, Sunday=6

# Encode categorical variables
df['hostel_id_encoded'] = df['hostel_id'].map({'A': 0, 'B': 1, 'C': 2, 'D': 3})
df['wing_encoded'] = df['wing'].map({'A': 0, 'B': 1})

# If room_status exists, encode it
if 'room_status' in df.columns:
    df['room_status_encoded'] = df['room_status'].map({'Occupied': 1, 'Empty': 0})
else:
    df['room_status_encoded'] = (df['students_present'] > 0).astype(int)

# Convert Booleans explicitly to integers
df['is_weekend'] = df['is_weekend'].astype(int)
df['is_holiday'] = df['is_holiday'].astype(int)

# Validate energy difference calculation
df['energy_difference'] = df['actual_energy_kwh'] - df['expected_energy_kwh']

log_message(f"Preprocessing completed. Cleaned dataset size: {df.shape}")


# =====================================================================
# PHASE 3 – EXPLORATORY DATA ANALYSIS (EDA)
# =====================================================================
log_message("Phase 3: Generating EDA visualizations...")

# 1. Class distribution (Normal vs Anomaly)
plt.figure(figsize=(6, 4))
sns.countplot(x='anomaly', data=df, palette=['#3B82F6', '#EF4444'])
plt.title("Class Distribution (Normal vs Anomaly)")
plt.xlabel("Anomaly Class (0=Normal, 1=Wastage)")
plt.ylabel("Record Count")
plt.savefig("eda_plots/class_distribution.png", dpi=150, bbox_inches='tight')
plt.close()

# 2. Energy consumption distribution
plt.figure(figsize=(8, 5))
sns.histplot(df['actual_energy_kwh'], color='#2563EB', kde=True, label='Actual Energy', alpha=0.6)
sns.histplot(df['expected_energy_kwh'], color='#93C5FD', kde=True, label='Expected Energy', alpha=0.4)
plt.title("Energy Consumption Distribution (kWh)")
plt.xlabel("Energy (kWh)")
plt.legend()
plt.savefig("eda_plots/energy_distribution.png", dpi=150, bbox_inches='tight')
plt.close()

# 3. Expected vs Actual Energy scatter comparison
plt.figure(figsize=(7, 5))
sns.scatterplot(x='expected_energy_kwh', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#22C55E', '#EF4444'], alpha=0.7)
plt.plot([df['expected_energy_kwh'].min(), df['expected_energy_kwh'].max()],
         [df['expected_energy_kwh'].min(), df['expected_energy_kwh'].max()],
         'k--', label='Reference Line')
plt.title("Expected vs Actual Energy Comparison")
plt.xlabel("Expected Energy (kWh)")
plt.ylabel("Actual Energy (kWh)")
plt.legend()
plt.savefig("eda_plots/expected_vs_actual.png", dpi=150, bbox_inches='tight')
plt.close()

# 4. Hour-wise energy consumption
plt.figure(figsize=(9, 5))
sns.lineplot(x='hour_of_day', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#2563EB', '#EF4444'], marker='o', errorbar=None)
plt.title("Hour-wise Average Energy Consumption")
plt.xlabel("Hour of Day (0-23)")
plt.ylabel("Avg Actual Energy (kWh)")
plt.grid(True, linestyle='--', alpha=0.5)
plt.savefig("eda_plots/hour_wise_consumption.png", dpi=150, bbox_inches='tight')
plt.close()

# 5. Temperature vs Energy
plt.figure(figsize=(7, 5))
sns.scatterplot(x='temperature', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#3B82F6', '#EF4444'])
plt.title("Temperature vs Energy Consumption")
plt.xlabel("Temperature (°C)")
plt.ylabel("Actual Energy (kWh)")
plt.savefig("eda_plots/temperature_vs_energy.png", dpi=150, bbox_inches='tight')
plt.close()

# 6. Hostel-wise energy usage
plt.figure(figsize=(7, 5))
sns.barplot(x='hostel_id', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#3B82F6', '#EF4444'], errorbar=None)
plt.title("Hostel-wise Average Energy Usage")
plt.xlabel("Hostel ID")
plt.ylabel("Avg Actual Energy (kWh)")
plt.savefig("eda_plots/hostel_wise_energy.png", dpi=150, bbox_inches='tight')
plt.close()

# 7. Floor-wise comparison
plt.figure(figsize=(7, 5))
sns.barplot(x='floor_no', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#3B82F6', '#EF4444'], errorbar=None)
plt.title("Floor-wise Average Energy Usage")
plt.xlabel("Floor Number")
plt.ylabel("Avg Actual Energy (kWh)")
plt.savefig("eda_plots/floor_wise_comparison.png", dpi=150, bbox_inches='tight')
plt.close()

# 8. Weekend vs Working Day comparison
plt.figure(figsize=(6, 4))
sns.barplot(x='is_weekend', y='actual_energy_kwh', hue='anomaly', data=df, palette=['#3B82F6', '#EF4444'], errorbar=None)
plt.title("Weekend vs Weekday Average Energy Usage")
plt.xlabel("Is Weekend (0=Weekday, 1=Weekend)")
plt.ylabel("Avg Actual Energy (kWh)")
plt.savefig("eda_plots/weekend_vs_weekday.png", dpi=150, bbox_inches='tight')
plt.close()

# 9. Correlation Heatmap of numerical columns
plt.figure(figsize=(10, 8))
numerical_cols = [
    'floor_no', 'room_no', 'room_capacity', 'students_present', 'students_outside',
    'students_on_leave', 'is_weekend', 'is_holiday', 'hour_of_day', 'temperature',
    'expected_energy_kwh', 'actual_energy_kwh', 'energy_difference', 'anomaly'
]
corr_matrix = df[numerical_cols].corr()
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt=".2f", linewidths=0.5, cbar=True)
plt.title("Feature Correlation Matrix Heatmap")
plt.savefig("eda_plots/correlation_heatmap.png", dpi=150, bbox_inches='tight')
plt.close()

log_message("All 9 initial EDA charts generated and saved inside 'eda_plots/' folder.")


# =====================================================================
# PHASE 4 – FEATURE SELECTION
# =====================================================================
log_message("Phase 4: Preparing features and splitting dataset...")

features_cols = [
    'floor_no', 'room_no', 'room_capacity', 'students_present', 'students_outside',
    'students_on_leave', 'is_weekend', 'is_holiday', 'hour_of_day', 'temperature',
    'expected_energy_kwh', 'actual_energy_kwh', 'energy_difference',
    'hostel_id_encoded', 'wing_encoded', 'room_status_encoded', 'month', 'day', 'day_of_week_encoded'
]

X = df[features_cols]
y = df['anomaly']

# Stratified split because target is imbalanced (44 anomaly vs 956 normal)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Standardize features (scale numeric values for models like Logistic Regression)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

log_message(f"Split completed. Training set: {X_train.shape[0]} records, Test set: {X_test.shape[0]} records.")
log_message(f"Train Class Distribution:\n{y_train.value_counts()}")
log_message(f"Test Class Distribution:\n{y_test.value_counts()}")


# =====================================================================
# PHASE 5 – MODEL TRAINING & COMPARISON
# =====================================================================
log_message("Phase 5: Training and comparing multiple models...")

models_dict = {
    "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(random_state=42, n_estimators=100),
    "XGBoost": XGBClassifier(random_state=42, eval_metric='logloss')
}

results = {}

for name, model in models_dict.items():
    log_message(f"Training {name}...")
    # Use scaled data for Logistic Regression, raw data for Tree models
    if name == "Logistic Regression":
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        probs = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, "predict_proba") else [0]*len(preds)
    else:
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else [0]*len(preds)
        
    accuracy = accuracy_score(y_test, preds)
    precision = precision_score(y_test, preds, zero_division=0)
    recall = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    
    try:
        auc = roc_auc_score(y_test, probs)
    except Exception:
        auc = 0.5
        
    results[name] = {
        "model_object": model,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "auc": auc,
        "predictions": preds,
        "probabilities": probs
    }

# Display comparisons
print("\n--- CLASSIFICATION MODELS COMPARISON TABLE ---")
print(f"{'Algorithm':<22} | {'Accuracy':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'ROC-AUC':<10}")
print("-" * 80)
for name, metric in results.items():
    print(f"{name:<22} | {metric['accuracy']:<10.4f} | {metric['precision']:<10.4f} | {metric['recall']:<10.4f} | {metric['f1_score']:<10.4f} | {metric['auc']:<10.4f}")

# Automatically select the best model (using F1-Score, then Accuracy)
best_model_name = max(results, key=lambda k: (results[k]["f1_score"], results[k]["accuracy"]))
log_message(f"Automatically selected best performing model: {best_model_name}")

best_model_info = results[best_model_name]
best_model = best_model_info["model_object"]


# =====================================================================
# PHASE 6 – MODEL EVALUATION
# =====================================================================
log_message("Phase 6: Evaluating selected best model...")

print(f"\n==========================================")
print(f"  BEST MODEL DETAILS: {best_model_name}  ")
print(f"==========================================")
print(f"Accuracy : {best_model_info['accuracy']:.4f}")
print(f"Precision: {best_model_info['precision']:.4f}")
print(f"Recall   : {best_model_info['recall']:.4f}")
print(f"F1-Score : {best_model_info['f1_score']:.4f}")
print(f"ROC-AUC  : {best_model_info['auc']:.4f}")

print("\n--- CLASSIFICATION REPORT ---")
if best_model_name == "Logistic Regression":
    test_preds = best_model.predict(X_test_scaled)
else:
    test_preds = best_model.predict(X_test)
print(classification_report(y_test, test_preds, zero_division=0))

print("\n--- CONFUSION MATRIX ---")
cm = confusion_matrix(y_test, test_preds)
print(cm)

# Save confusion matrix plot
plt.figure(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
plt.title(f"Confusion Matrix ({best_model_name})")
plt.xlabel("Predicted Class")
plt.ylabel("True Class")
plt.savefig("eda_plots/confusion_matrix.png", dpi=150, bbox_inches='tight')
plt.close()

# Generate feature importance chart (Phase 3 & 6 requirement)
if hasattr(best_model, "feature_importances_"):
    importances = best_model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x=importances[indices], y=[features_cols[i] for i in indices], palette='viridis')
    plt.title(f"Feature Importances ({best_model_name})")
    plt.xlabel("Relative Importance")
    plt.ylabel("Features")
    plt.savefig("eda_plots/feature_importance.png", dpi=150, bbox_inches='tight')
    plt.close()
    log_message("Saved Feature Importance plot to 'eda_plots/feature_importance.png'.")
elif best_model_name == "Logistic Regression":
    importances = np.abs(best_model.coef_[0])
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=(10, 6))
    sns.barplot(x=importances[indices], y=[features_cols[i] for i in indices], palette='viridis')
    plt.title("Feature Coefficients (Logistic Regression)")
    plt.xlabel("Absolute Coefficient Weight")
    plt.ylabel("Features")
    plt.savefig("eda_plots/feature_importance.png", dpi=150, bbox_inches='tight')
    plt.close()
    log_message("Saved Feature Coefficients plot to 'eda_plots/feature_importance.png'.")

# Save model and scaler state
payload = {
    "model_name": best_model_name,
    "model": best_model,
    "scaler": scaler,
    "feature_columns": features_cols,
    "accuracy": best_model_info['accuracy'],
    "f1_score": best_model_info['f1_score']
}

joblib.dump(payload, "best_model.pkl")
log_message("Successfully saved model checkpoint payload to 'best_model.pkl'.")
log_message("Pipeline complete!")
