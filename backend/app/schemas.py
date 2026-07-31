from pydantic import BaseModel, Field
from typing import Optional, List

class AnalysisResult(BaseModel):
    original_name: str = Field(..., description="Original filename uploaded by the user")
    suggested_name: str = Field(..., description="AI suggested clean filename with preserved extension")
    filename: str = Field(..., description="Suggested filename (matches schema requirement)")
    category: str = Field(..., description="Categorization (e.g., Bills, Work, Personal, Development, University)")
    folder: str = Field(..., description="Suggested destination folder path (e.g., Documents/Bills)")
    suggested_folder: str = Field(..., description="Suggested target folder path (matches schema requirement)")
    reason: str = Field(..., description="One sentence concise explanation for the recommendation")
    summary: str = Field(..., description="Short analysis summary (matches schema requirement)")
    tags: List[str] = Field(default_factory=list, description="Categorization tags")
    confidence: float = Field(default=0.95, description="Estimated confidence score between 0.0 and 1.0")
    provider_used: str = Field(default="bedrock", description="Analysis provider used ('bedrock' or 'fallback')")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Human friendly error message")
    code: Optional[str] = Field(default="BAD_REQUEST", description="Error type identifier")
