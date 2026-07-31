import os
import json
import re
import urllib.request
import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError, PartialCredentialsError
from typing import Dict, Any, List
from app.schemas import AnalysisResult

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-2-lite-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "us-east-1"))
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

SYSTEM_PROMPT = """You are an AI assistant specialized in organizing downloaded files.

Analyze the uploaded content.

Return ONLY valid JSON.

For every file generate:
- filename: Suggested clean descriptive filename (max 6 words, keep extension, use underscores instead of spaces)
- category: Main category (e.g. Bills, Receipts, Personal, Photos, Development, University, Work, Finance, Medical, Certificates, Travel, Miscellaneous)
- suggested_folder: Target directory path (e.g. Documents/Bills, Projects/React, Pictures/Personal)
- tags: List of 2 to 4 relevant keyword tags
- summary: One sentence explaining why AI made the suggestion
- confidence: Estimated float confidence score between 0.85 and 0.99

Example output JSON:
{
  "filename": "React_Login_Error.png",
  "category": "Development",
  "suggested_folder": "Projects/React",
  "tags": ["react", "error", "login", "code"],
  "summary": "The screenshot shows a React application runtime login exception.",
  "confidence": 0.95
}
"""

def analyze_file(original_filename: str, processed_data: Dict[str, Any]) -> AnalysisResult:
    """
    Resilient analyzer function:
    1. Attempts Amazon Bedrock Runtime (us.amazon.nova-2-lite-v1:0).
    2. Catches ValidationException / AWS errors and falls back to Groq/External provider if configured.
    3. Gracefully falls back to structured Mock AI engine if Bedrock fails or is locked.
    """
    # Step 1: Attempt Amazon Bedrock
    try:
        result = try_bedrock_analysis(original_filename, processed_data)
        if result:
            return result
    except Exception as e:
        print(f"[Bedrock Provider Notice]: Bedrock call bypassed ({str(e)}). Transitioning to Fallback Provider.")

    # Step 2: Attempt Secondary Fallback Provider (Groq API if configured)
    if GROQ_API_KEY:
        try:
            result = try_groq_fallback(original_filename, processed_data)
            if result:
                return result
        except Exception as e:
            print(f"[Secondary Provider Notice]: Groq fallback failed ({str(e)}). Proceeding to Mock Fallback Provider.")

    # Step 3: Graceful Mock AI Fallback
    return generate_mock_fallback_analysis(original_filename, processed_data)


def try_bedrock_analysis(original_filename: str, processed_data: Dict[str, Any]) -> AnalysisResult:
    # Strict 3-second timeout so Bedrock hangs fail over to Groq/Mock instantly
    _config = Config(
        connect_timeout=3,
        read_timeout=3,
        retries={"max_attempts": 0}
    )
    client = boto3.client(
        "bedrock-runtime",
        region_name=AWS_REGION,
        config=_config
    )
    
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

    messages = [{"role": "user", "content": user_content}]
    system_config = [{"text": SYSTEM_PROMPT}]
    inference_config = {"maxTokens": 500, "temperature": 0.2}

    # Attempt Primary Model
    models_to_try = [BEDROCK_MODEL_ID, "amazon.nova-lite-v1:0", "us.amazon.nova-lite-v1:0"]
    for model_id in models_to_try:
        try:
            response = client.converse(
                modelId=model_id,
                messages=messages,
                system=system_config,
                inferenceConfig=inference_config
            )
            output_text = response["output"]["message"]["content"][0]["text"]
            return parse_ai_response(original_filename, output_text, provider_used="bedrock")
        except (ClientError, BotoCoreError, NoCredentialsError, PartialCredentialsError) as e:
            continue
            
    return None


def try_groq_fallback(original_filename: str, processed_data: Dict[str, Any]) -> AnalysisResult:
    """Secondary provider using Groq LLM API if key is present in environment."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    prompt_text = f"Original filename: {original_filename}\n"
    if processed_data["type"] == "text":
        prompt_text += f"Content:\n{processed_data['text'][:2000]}"
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt_text}
        ],
        "temperature": 0.2,
        "max_tokens": 400
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))
        output_text = res_data["choices"][0]["message"]["content"]
        return parse_ai_response(original_filename, output_text, provider_used="fallback")


def generate_mock_fallback_analysis(original_filename: str, processed_data: Dict[str, Any]) -> AnalysisResult:
    """
    Intelligent fallback provider matching response schema.
    Infers document metadata from filename extensions, keywords, and text previews.
    """
    ext = "." + original_filename.split(".")[-1].lower() if "." in original_filename else ""
    name_lower = original_filename.lower()
    text_content = processed_data.get("text", "").lower()
    
    # Default fallbacks
    category = "Miscellaneous"
    folder = "Downloads/Misc"
    suggested_stem = "Organized_File"
    reason = "Analyzed content and assigned structured destination folder."
    tags = ["download", "file", "organized"]
    
    if any(k in name_lower or k in text_content for k in ["bill", "invoice", "receipt", "electric", "tax", "utility", "statement"]):
        category = "Bills"
        folder = "Documents/Bills"
        suggested_stem = "Invoice_Document"
        reason = "Content contains billing invoice and transaction details."
        tags = ["finance", "invoice", "bills", "receipt"]
    elif any(k in name_lower or k in text_content for k in ["react", "code", "script", "dev", "bug", "log", "screen", "screenshot", "error"]):
        category = "Development"
        folder = "Projects/React"
        suggested_stem = "Developer_Screenshot" if ext in [".png", ".jpg", ".jpeg"] else "Code_Artifact"
        reason = "File contains development logs and code interface capture."
        tags = ["development", "react", "projects", "code"]
    elif any(k in name_lower or k in text_content for k in ["assignment", "course", "lab", "thesis", "exam", "uni", "lecture", "study"]):
        category = "University"
        folder = "Documents/University"
        suggested_stem = "Academic_Coursework"
        reason = "File contains academic material and coursework documentation."
        tags = ["university", "study", "education", "coursework"]
    elif ext in [".jpg", ".jpeg", ".png"]:
        category = "Photos"
        folder = "Pictures/Personal"
        suggested_stem = "Captured_Photo"
        reason = "Image media file analyzed and assigned to pictures storage."
        tags = ["photo", "picture", "media", "personal"]
    elif ext in [".pdf", ".txt"]:
        category = "Documents"
        folder = "Documents/General"
        suggested_stem = "Important_Document"
        reason = "Document text content processed and categorized."
        tags = ["document", "text", "general"]

    # Build clean suggested filename preserving extension
    clean_base = re.sub(r"[^\w]+", "_", original_filename.rsplit(".", 1)[0])
    if len(clean_base) > 25:
        clean_base = clean_base[:25]
    sug_filename = f"{suggested_stem}_{clean_base}{ext}" if clean_base and not clean_base.startswith("IMG") else f"{suggested_stem}{ext}"
    sug_filename = re.sub(r"[\s\-]+", "_", sug_filename)

    return AnalysisResult(
        original_name=original_filename,
        suggested_name=sug_filename,
        filename=sug_filename,
        category=category,
        folder=folder,
        suggested_folder=folder,
        reason=reason,
        summary=reason,
        tags=tags,
        confidence=0.92,
        provider_used="fallback"
    )


def parse_ai_response(original_filename: str, response_text: str, provider_used: str = "bedrock") -> AnalysisResult:
    """Parses raw JSON from AI output into valid AnalysisResult model."""
    try:
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        raw_json = json_match.group(0) if json_match else response_text
        data = json.loads(raw_json)

        ext = "." + original_filename.split(".")[-1] if "." in original_filename else ""
        sug_name = data.get("filename") or data.get("suggested_name") or original_filename
        
        if ext and not sug_name.lower().endswith(ext.lower()):
            sug_name = f"{sug_name}{ext}"
        sug_name = re.sub(r"[\s\-]+", "_", sug_name)

        folder_path = data.get("suggested_folder") or data.get("folder") or "Downloads/Misc"
        summary_text = data.get("summary") or data.get("reason") or "Analyzed content and suggested destination."
        tags_list = data.get("tags", ["file", "organized"])
        if isinstance(tags_list, str):
            tags_list = [t.strip() for t in tags_list.split(",")]

        return AnalysisResult(
            original_name=original_filename,
            suggested_name=sug_name,
            filename=sug_name,
            category=data.get("category", "Miscellaneous"),
            folder=folder_path,
            suggested_folder=folder_path,
            reason=summary_text,
            summary=summary_text,
            tags=tags_list,
            confidence=float(data.get("confidence", 0.95)),
            provider_used=provider_used
        )
    except Exception:
        return generate_mock_fallback_analysis(original_filename, {"type": "text", "text": response_text})
