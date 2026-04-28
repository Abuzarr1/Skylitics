"""
Skylytics — Evaluation Metrics Utilities
=========================================
Shared metric computation and reporting functions
for classification and regression tasks.

Usage:
    from utils.metrics import evaluate_classifier, evaluate_regressor, print_evaluation_report
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from sklearn.metrics import (
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
    confusion_matrix,
    classification_report,
    mean_squared_error,
    mean_absolute_error,
)


# ---------------------------------------------------------------------------
# Classification Metrics
# ---------------------------------------------------------------------------

def evaluate_classifier(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None,
    model_name: str = "Model",
) -> Dict[str, Any]:
    """
    Compute all classification metrics for a delay prediction model.

    Parameters
    ----------
    y_true : array-like
        Ground truth binary labels (0/1).
    y_pred : array-like
        Predicted binary labels (0/1).
    y_prob : array-like, optional
        Predicted probabilities for the positive class (needed for ROC-AUC).
    model_name : str
        Name of the model for reporting.

    Returns
    -------
    dict
        Dictionary with all classification metrics.
    """
    metrics = {
        "model": model_name,
        "task": "classification",
        "f1_score": float(f1_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred)),
        "recall": float(recall_score(y_true, y_pred)),
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }

    if y_prob is not None:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
    else:
        metrics["roc_auc"] = None

    return metrics


# ---------------------------------------------------------------------------
# Regression Metrics
# ---------------------------------------------------------------------------

def evaluate_regressor(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    model_name: str = "Model",
) -> Dict[str, Any]:
    """
    Compute all regression metrics for delay duration prediction.

    Parameters
    ----------
    y_true : array-like
        Ground truth delay duration in minutes.
    y_pred : array-like
        Predicted delay duration in minutes.
    model_name : str
        Name of the model for reporting.

    Returns
    -------
    dict
        Dictionary with all regression metrics.
    """
    mse = mean_squared_error(y_true, y_pred)
    metrics = {
        "model": model_name,
        "task": "regression",
        "rmse": float(np.sqrt(mse)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
    }

    return metrics


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def print_evaluation_report(metrics: Dict[str, Any]) -> None:
    """
    Pretty-print an evaluation metrics dictionary.

    Parameters
    ----------
    metrics : dict
        Output from evaluate_classifier or evaluate_regressor.
    """
    print(f"\n{'='*50}")
    print(f"  {metrics['model']} — {metrics['task'].upper()}")
    print(f"{'='*50}")

    if metrics["task"] == "classification":
        if metrics.get("roc_auc") is not None:
            print(f"  ROC-AUC   : {metrics['roc_auc']:.4f}")
        print(f"  F1-Score  : {metrics['f1_score']:.4f}")
        print(f"  Precision : {metrics['precision']:.4f}")
        print(f"  Recall    : {metrics['recall']:.4f}")
        print(f"\n  Confusion Matrix:")
        cm = np.array(metrics["confusion_matrix"])
        print(f"    TN={cm[0,0]:>8,}  FP={cm[0,1]:>8,}")
        print(f"    FN={cm[1,0]:>8,}  TP={cm[1,1]:>8,}")

    elif metrics["task"] == "regression":
        print(f"  RMSE : {metrics['rmse']:.4f}")
        print(f"  MAE  : {metrics['mae']:.4f}")

    print(f"{'='*50}\n")


def metrics_to_dataframe(metrics_list: list) -> pd.DataFrame:
    """
    Convert a list of metric dictionaries to a comparison DataFrame.

    Parameters
    ----------
    metrics_list : list of dict
        List of outputs from evaluate_classifier or evaluate_regressor.

    Returns
    -------
    pd.DataFrame
        Tabular comparison of all models.
    """
    rows = []
    for m in metrics_list:
        row = {"Model": m["model"], "Task": m["task"]}
        if m["task"] == "classification":
            row["ROC-AUC"] = m.get("roc_auc")
            row["F1"] = m["f1_score"]
            row["Precision"] = m["precision"]
            row["Recall"] = m["recall"]
        elif m["task"] == "regression":
            row["RMSE"] = m["rmse"]
            row["MAE"] = m["mae"]
        rows.append(row)

    return pd.DataFrame(rows)
