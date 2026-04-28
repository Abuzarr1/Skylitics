"""
SHAP-based explainability for the XGBoost delay classifier.

Usage
-----
from app.ml.explain.shap_explainer import explain_prediction, explain_simple

result = explain_prediction(cleaned_input)   # full SHAP breakdown
simple = explain_simple(cleaned_input)       # plain-text summary
"""
from __future__ import annotations
import shap
from app.ml.models.xgboost_clf import clf, encoders, ENGINE, FEATURE_COLS, FEATURE_LABELS
from app.ml.pipeline.features import build_features

# Build a single TreeExplainer once at import time (expensive to create each call)
_explainer = shap.TreeExplainer(clf) if ENGINE == "xgboost" else None


def _get_explainer():
    global _explainer
    if _explainer is None and ENGINE == "xgboost":
        _explainer = shap.TreeExplainer(clf)
    return _explainer


def explain_prediction(cleaned: dict) -> dict:
    """
    Return full SHAP breakdown for a single prediction input.

    Parameters
    ----------
    cleaned : output of clean_input()

    Returns
    -------
    {
        method: "shap_tree",
        expected_value: float,
        shap_values: {feature_label: shap_value, ...},
        top_factors: [{"feature", "shap_value", "direction", "rank"}, ...],
        plain_text: str,
    }
    """
    explainer = _get_explainer()
    if explainer is None:
        return _mock_explanation(cleaned)

    df = build_features(cleaned, encoders)
    sv = explainer.shap_values(df)[0]              # shape (7,)
    base = float(explainer.expected_value)

    shap_map = {FEATURE_LABELS[col]: float(sv[i]) for i, col in enumerate(FEATURE_COLS)}
    sorted_factors = sorted(shap_map.items(), key=lambda x: abs(x[1]), reverse=True)

    top_factors = [
        {
            "rank":       rank + 1,
            "feature":    name,
            "shap_value": round(val, 4),
            "direction":  "increases delay risk" if val > 0 else "reduces delay risk",
        }
        for rank, (name, val) in enumerate(sorted_factors[:5])
    ]

    plain_lines = ["Key factors driving this prediction:"]
    for f in top_factors:
        arrow = "▲" if f["shap_value"] > 0 else "▼"
        plain_lines.append(
            f"  {f['rank']}. {f['feature']}: {arrow} {abs(f['shap_value']):.3f} ({f['direction']})"
        )

    return {
        "method":         "shap_tree",
        "expected_value": round(base, 4),
        "shap_values":    {k: round(v, 4) for k, v in shap_map.items()},
        "top_factors":    top_factors,
        "plain_text":     "\n".join(plain_lines),
    }


def explain_simple(cleaned: dict) -> dict:
    """
    Plain-language summary of the top delay driver.
    Always returns 200 — falls back gracefully when SHAP unavailable.
    """
    explainer = _get_explainer()
    if explainer is None:
        return _mock_simple(cleaned)

    df = build_features(cleaned, encoders)
    sv = explainer.shap_values(df)[0]

    top_idx  = int(abs(sv).argmax())
    top_col  = FEATURE_COLS[top_idx]
    top_name = FEATURE_LABELS[top_col]
    top_val  = float(sv[top_idx])
    impact   = "increases" if top_val > 0 else "reduces"

    pct = int(abs(top_val) * 100)
    summary = (
        f"The biggest driver is **{top_name}**, which {impact} delay risk by ~{pct} percentage points. "
    )

    # secondary
    second_idx = int(abs(sv).argsort()[::-1][1]) if len(sv) > 1 else None
    if second_idx is not None:
        second_name = FEATURE_LABELS[FEATURE_COLS[second_idx]]
        second_val  = float(sv[second_idx])
        second_pct  = int(abs(second_val) * 100)
        second_dir  = "further increases" if second_val > 0 else "partially offsets"
        summary += f"{second_name} {second_dir} risk by ~{second_pct} points."

    return {"summary": summary, "engine": "shap_tree"}


# ─── Fallback when models unavailable ────────────────────────────────────────

def _mock_explanation(cleaned: dict) -> dict:
    factors = [
        {"rank": 1, "feature": "Departure Hour",    "shap_value": -0.25, "direction": "reduces delay risk"},
        {"rank": 2, "feature": "Flight Distance",   "shap_value":  0.18, "direction": "increases delay risk"},
        {"rank": 3, "feature": "Airline",           "shap_value":  0.12, "direction": "increases delay risk"},
        {"rank": 4, "feature": "Departure Month",   "shap_value":  0.07, "direction": "increases delay risk"},
        {"rank": 5, "feature": "Origin Airport",    "shap_value": -0.03, "direction": "reduces delay risk"},
    ]
    return {
        "method":         "mock",
        "expected_value": 0.0,
        "shap_values":    {f["feature"]: f["shap_value"] for f in factors},
        "top_factors":    factors,
        "plain_text":     "Mock explanation — model assets not loaded.",
    }


def _mock_simple(cleaned: dict) -> dict:
    return {
        "summary": "The biggest driver is Departure Hour, which reduces delay risk by ~25 percentage points.",
        "engine":  "mock",
    }
