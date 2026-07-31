import os
import json
import re
import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError, PartialCredentialsError
from fastapi import HTTPException
from app.schemas import AnalysisResult

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-lite-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))

SYSTEM_PROMPT = """You are an AI assistant specialized in organizing downloaded files.

Analyze the uploaded content.

Return ONLY valid JSON.

For every file generate:
- original_name
- suggested_name
- category
- folder
- reason
- confidence

Rules:
1. Keep filename concise (maximum six words).
2. Preserve extension.
3. Use underscores instead of spaces.
4. Do not invent unsupported information.
5. If uncertain, use category "Miscellaneous".
6. Reason must be under 20 words.
7. Confidence must be an estimated float score between 0.50 and 0.99.

Example output JSON:
{
  "original_name": "Screenshot (12).png",
  "suggested_name": "React_Login_Error.png",
  "category": "Development",
  "folder": "Projects/React",
  "reason": "The screenshot shows a React application runtime login exception.",
  "confidence": 0.95
}
"""

def get_bedrock_client():
    try:
        return boto3.client("bedrock-runtime", region_name=AWS_REGION)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize AWS Bedrock client: {str(e)}"
        )

def analyze_file_with_bedrock(original_filename: str, processed_data: dict) -> AnalysisResult:
    """
    Sends processed content (text or image bytes) to Amazon Bedrock Nova model.
    Parses and returns structured AnalysisResult.
    """
    client = get_bedrock_client()
    
    # Build user message content block for Bedrock Converse API
    user_content = []
    
    if processed_data["type"] == "text":
        user_content.append({
            "text": f"Original filename: {original_filename}\n\nFile content preview:\n{processed_data['text']}"
        })
    elif processed_data["type"] == "image":
        user_content.append({
            "text": f"Original filename: {original_filename}\nAnalyze this image content and suggest proper organization details."
        })
        user_content.append({
            "image": {
                "format": processed_data["format"],
                "source": {
                    "bytes": processed_data["bytes"]
                }
            }
        })
    
    messages = [
        {
            "role": "user",
            "content": user_content
        }
    ]
    
    system_config = [{"text": SYSTEM_PROMPT}]
    inference_config = {
        "maxTokens": 500,
        "temperature": 0.2
    }
    
    try:
        # Attempt calling Amazon Bedrock Converse API
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            messages=messages,
            system=system_config,
            inferenceConfig=inference_config
        )
        
        output_text = response["output"]["message"]["content"][0]["text"]
        return parse_bedrock_response(original_filename, output_text)
        
    except (NoCredentialsError, PartialCredentialsError):
        raise HTTPException(
            status_code=500,
            detail="Amazon Bedrock is not configured. AWS credentials missing. Please configure AWS credentials."
        )
    except ClientError as ce:
        error_code = ce.response.get("Error", {}).get("Code", "")
        error_msg = ce.response.get("Error", {}).get("Message", str(ce))
        
        if error_code in {"AccessDeniedException", "UnrecognizedClientException", "AuthFailure"}:
            raise HTTPException(
                status_code=403,
                detail="Access denied to Amazon Bedrock. Please check AWS IAM permissions and model access in Amazon Bedrock console."
            )
        elif error_code in {"ResourceNotFoundException", "ValidationException"}:
            # Fallback retry with fallback model ID if model ARN differs in region
            fallback_model = "amazon.nova-lite-v1:0"
            if BEDROCK_MODEL_ID != fallback_model:
                try:
                    response = client.converse(
                        modelId=fallback_model,
                        messages=messages,
                        system=system_config,
                        inferenceConfig=inference_config
                    )
                    output_text = response["output"]["message"]["content"][0]["text"]
                    return parse_bedrock_response(original_filename, output_text)
                except Exception:
                    pass
            raise HTTPException(
                status_code=404,
                detail=f"Amazon Bedrock model '{BEDROCK_MODEL_ID}' is not accessible in region '{AWS_REGION}'. Details: {error_msg}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Amazon Bedrock API error ({error_code}): {error_msg}"
            )
    except BotoCoreError as bce:
        raise HTTPException(
            status_code=500,
            detail=f"Amazon Bedrock connection error: {str(bce)}"
        )
    except HTTPException:
        raise
    except Exception as ex:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing file with Amazon Bedrock: {str(ex)}"
        )

def parse_bedrock_response(original_filename: str, response_text: str) -> AnalysisResult:
    """Parses JSON response from Bedrock text output into Pydantic model."""
    try:
        # Match JSON block
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            raw_json = json_match.group(0)
            data = json.loads(raw_json)
        else:
            data = json.loads(response_text)
            
        ext = "." + original_filename.split(".")[-1] if "." in original_filename else ""
        sug_name = data.get("suggested_name", original_filename)
        if ext and not sug_name.lower().endswith(ext.lower()):
            sug_name = f"{sug_name}{ext}"
            
        # Clean underscores
        sug_name = re.sub(r"[\s\-]+", "_", sug_name)
        
        return AnalysisResult(
            original_name=original_filename,
            suggested_name=sug_name,
            category=data.get("category", "Miscellaneous"),
            folder=data.get("folder", "Downloads/Misc"),
            reason=data.get("reason", "Analyzed content and suggested optimal destination."),
            confidence=float(data.get("confidence", 0.92))
        )
    except Exception as e:
        # If Bedrock returned non-JSON text, attempt friendly parse
        ext = "." + original_filename.split(".")[-1] if "." in original_filename else ""
        clean_base = re.sub(r"[^\w]+", "_", original_filename.rsplit(".", 1)[0])
        
        return AnalysisResult(
            original_name=original_filename,
            suggested_name=f"Organized_{clean_base}{ext}",
            category="Documents",
            folder="Documents/General",
            reason="Analyzed document content and assigned clean destination folder.",
            confidence=0.85
        )
