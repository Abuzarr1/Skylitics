import joblib
import os
import pandas as pd
import numpy as np

# --- 1. Load All Assets ---
# This code runs ONCE when the API server starts.
# It loads all our models and encoders into memory.

MODEL_DIR = "skylytics_model_assets"

try:
    # --- Load Models ---
    # We'll just use the XGBoost models for our baseline API
    # You can easily swap them for lgbm models later
    clf = joblib.load(os.path.join(MODEL_DIR, "xgb_classifier.pkl"))
    reg = joblib.load(os.path.join(MODEL_DIR, "xgb_regressor.pkl"))
    
    # --- Load Encoders ---
    encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
    
    print("[Skylytics API]: All models and encoders loaded successfully.")

except FileNotFoundError:
    print(f"❌ [Skylytics API ERROR]: Model files not found in '{MODEL_DIR}'.")
    print("Make sure the 'skylytics_model_assets' folder is in the same directory.")
    clf, reg, encoders = None, None, None


# --- 2. Define the Feature Engineering Function ---
# This private helper function performs the *exact same*
# feature engineering we did in our Colab notebook.

def _engineer_features(raw_data_dict):
    """
    Takes a single dictionary of raw API data and
    returns a model-ready DataFrame row.
    """
    
    # 1. Convert dictionary to a DataFrame
    df = pd.DataFrame([raw_data_dict])
    
    # 2. Perform Step 3.1: Time Features
    # 930 -> (as string) '930' -> (zfill) '0930' -> (slice) '09' -> (as int) 9
    df['DEPARTURE_HOUR'] = df['SCHEDULED_DEPARTURE'].astype(str).str.zfill(4).str[:2].astype(int)
    
    # 3. Perform Step 3.2: Categorical Features
    # Use our *loaded* encoders to transform the text
    for col, le in encoders.items():
        # Use .transform()
        df[f'{col}_ENCODED'] = le.transform(df[col])
        
    # 4. Define final feature columns
    # MUST be in the same order as when we trained!
    feature_columns = [
        'MONTH',
        'DAY_OF_WEEK',
        'DISTANCE',
        'DEPARTURE_HOUR',
        'AIRLINE_ENCODED',
        'ORIGIN_AIRPORT_ENCODED',
        'DESTINATION_AIRPORT_ENCODED'
    ]
    
    # Fill any NaNs just in case
    final_features = df[feature_columns].fillna(0)
    
    return final_features


# --- 3. Define the Public API Functions ---
# These are the two functions your backend developer will call.

def predict_delay_likelihood(raw_data_dict):
    """
    Predicts the likelihood (probability) of a delay.
    Returns a dictionary.
    """
    if clf is None or encoders is None:
        return {"error": "Models not loaded."}
    
    try:
        # 1. Engineer the features
        features = _engineer_features(raw_data_dict)
        
        # 2. Get probability prediction
        # [:, 1] gets the probability of "1" (Delayed)
        probability = clf.predict_proba(features)[0][1]
        
        return {
            "prediction_label": "Delayed" if probability > 0.5 else "Not Delayed",
            "delay_likelihood": float(probability) # e.g., 0.75 (for 75%)
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {e}"}


def predict_delay_duration(raw_data_dict):
    """
    Predicts the duration (in minutes) of a delay.
    Returns a dictionary.
    """
    if reg is None:
        return {"error": "Model not loaded."}
        
    try:
        # 1. Engineer the features
        features = _engineer_features(raw_data_dict)
        
        # 2. Get numerical prediction
        duration = reg.predict(features)[0]
        
        # 3. Clean up the result (e.g., don't predict a -10 min delay)
        final_duration = max(0, float(duration)) 
        
        return {
            "predicted_delay_minutes": round(final_duration, 2)
        }
        
    except Exception as e:
        return {"error": f"Prediction failed: {e}"}


# --- Example of how to use this script ---
if __name__ == "__main__":
    # This block only runs if you execute this script directly
    # (e.g., "python prediction.py")
    
    print("\n--- Running a test prediction: ---")
    
    # This is a sample dictionary (like from a JSON API request)
    test_flight = {
        "MONTH": 1,
        "DAY_OF_WEEK": 4,
        "AIRLINE": "AA", # Must be a value the encoder has seen
        "ORIGIN_AIRPORT": "JFK", # Must be a value the encoder has seen
        "DESTINATION_AIRPORT": "LAX", # Must be a value the encoder has seen
        "SCHEDULED_DEPARTURE": 1730,
        "DISTANCE": 2475
    }
    
    likelihood = predict_delay_likelihood(test_flight)
    duration = predict_delay_duration(test_flight)
    
    print(f"Likelihood Prediction: {likelihood}")
    print(f"Duration Prediction: {duration}")