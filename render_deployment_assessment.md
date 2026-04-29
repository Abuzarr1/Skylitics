---
# Render Deployment — Problem Assessment Report

## Service Profile
- **Type:** Web Service
- **Runtime:** Python (FastAPI) 
- **Database:** PostgreSQL (Render hosted)
- **Status:** Brand new deployment, never successfully reached a "Live" state.

## The Error
```text
File "/opt/render/project/src/backend/skylitcs_backend/app/modules/predictions/router.py", line 39, in <module>
    from skylytics_adapters import from_legacy_input
ModuleNotFoundError: No module named 'skylytics_adapters'
```
- **Phase:** Deploy / Post-Deploy Runtime Crash (specifically during the `app = create_app()` initialization step).
- **Consistency:** The deployment has consistently failed, though the specific errors have evolved sequentially as previous missing dependencies were resolved.

## History & Attempted Fixes
| Attempted Fix | Target Issue | Result / Outcome |
| :--- | :--- | :--- |
| Added `pydantic[email]` | `ImportError: email-validator is not installed` | Resolved the email validator error, but surfaced a multipart error. |
| Fixed Large File Push | Git push failing due to 417MB repo size | Resolved by enforcing `.gitignore` to block `Dataset/` and model binaries. |
| Added `requests` | `ModuleNotFoundError: No module named 'requests'` | Resolved the requests error, but surfaced the SHAP error. |
| Added `shap` | `ModuleNotFoundError: No module named 'shap'` | Resolved the SHAP error, but surfaced the `skylytics_adapters` error. |
| Fixed Port Binding | `No open ports detected` | Modified `main.py` to read `$PORT` from environment variables, resolving startup hangs. |
| Robust Path Resolution | `ModuleNotFoundError` for local `skylytics_adapters` | **FAILED.** The error persisted despite modifying `sys.path` to point dynamically to the local `skylytics_model_assets/production` folder. |

## Configuration & Environment
| Key | Value |
| :--- | :--- |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **DATABASE_URL** | Configured via Render Database connection string |
| **PYTHON_VERSION** | `3.11` |

## Dependencies & Build Chain
- **Build Phase:** Completes successfully (`pip install` succeeds).
- **Dependency File:** `requirements.txt` is committed, up-to-date, and all 3rd-party pip packages are resolving correctly.
- **Local vs. Production:** The application works entirely locally but crashes on Render.

## Root Cause Analysis

### Most Probable Root Cause
The file `skylytics_adapters.py` does not exist on the Render server because it was blocked from being pushed to Git by the repository's `.gitignore` file.

### Why Previous Fixes Failed
The final attempted fix involved injecting absolute file paths into `sys.path` to help Python locate `skylytics_model_assets/production/skylytics_adapters.py`. However, this fix fundamentally assumed the file was present on the production server. Because the file was never committed to version control, no amount of path manipulation could resolve the missing module.

### The Layer Where the Problem Lives
The problem lives at the **Version Control / Repository Configuration** layer. 
Line 38 of `.gitignore` explicitly blocks the entire `skylytics_model_assets/` folder. While this was intentionally added to prevent massive ML binaries (like `skylytics_xgboost_regressor.json`) from bloating the Git repository, it silently blocked the lightweight python scripts inside that same folder. 

**Resolution Strategy applied:** Relocate the `skylytics_adapters.py` file to `app/ml/adapters/` (a tracked application directory) and update the corresponding import paths in `router.py` and `predictor.py`.
---
