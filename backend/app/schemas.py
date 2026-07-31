from pydantic import BaseModel, Field
from typing import Optional

class AnalysisResult(BaseModel):
    original_name: str = Field(..., description="Original filename uploaded by the user")
    suggested_name: str = Field(..., description="AI suggested clean filename with preserved extension")
    category: str = Field(..., description="Categorization (e.g., Bills, Work, Personal, Development, University)")
    folder: str = Field(..., description="Suggested destination folder path (e.g., Documents/Bills)")
    reason: str = Field(..., description="One sentence concise explanation for the recommendation")
    confidence: float = Field(default=0.92, description="Estimated confidence score between 0.0 and 1.0")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Human friendly error message")
    code: Optional[str] = Field(default="BAD_REQUEST", description="Error type identifier")
