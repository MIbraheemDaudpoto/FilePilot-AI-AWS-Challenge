from mangum import Mangum
from app.main import app

# AWS Lambda Handler using Mangum adapter for ASGI FastAPI app
handler = Mangum(app, api_gateway_base_path=None)
