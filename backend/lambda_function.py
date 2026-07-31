from mangum import Mangum
from app.main import app

# ─────────────────────────────────────────────────────────────────────
# AWS Lambda entry-point for FilePilot AI backend.
#
# Mangum wraps the FastAPI ASGI app and translates API Gateway HTTP API
# events into standard ASGI requests, allowing FastAPI to run serverless.
#
# Handler reference used in Lambda console:  lambda_function.handler
#
# Local development (do NOT use this file locally):
#   python -m uvicorn app.main:app --reload --port 8000
# ─────────────────────────────────────────────────────────────────────

handler = Mangum(app, lifespan="off", api_gateway_base_path=None)
