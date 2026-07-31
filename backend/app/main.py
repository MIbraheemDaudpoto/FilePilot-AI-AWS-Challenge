from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.schemas import AnalysisResult, ErrorResponse
from app.file_handler import validate_file, process_file_content
from app.bedrock_service import analyze_file_with_bedrock

app = FastAPI(
    title="FilePilot AI Backend",
    description="AWS Bedrock-powered API for intelligent file download organization",
    version="1.0.0"
)

# Enable CORS for local dev and AWS Amplify frontend host
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health", summary="Service Health Check")
def health_check():
    return {
        "status": "healthy",
        "service": "FilePilot AI Backend",
        "version": "1.0.0"
    }

@app.post(
    "/api/v1/analyze",
    response_model=List[AnalysisResult],
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file type or size"},
        500: {"model": ErrorResponse, "description": "Amazon Bedrock API error or configuration failure"}
    },
    summary="Analyze files and return AI recommendations"
)
async def analyze_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files were uploaded.")
        
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 files can be uploaded per batch.")
        
    results: List[AnalysisResult] = []
    
    for file in files:
        # Read content
        content = await file.read()
        
        # Validate size & extension
        ext = validate_file(file, content)
        
        # Extract/process content
        processed = process_file_content(file.filename or "file", ext, content)
        
        # Analyze with Amazon Bedrock
        result = analyze_file_with_bedrock(file.filename or "file", processed)
        results.append(result)
        
    return results
