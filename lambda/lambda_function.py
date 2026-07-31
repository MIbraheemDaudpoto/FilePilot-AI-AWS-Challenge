import json
import base64
import os
import re
import io
from email import policy
from email.parser import BytesParser
from botocore.config import Config
from botocore.exceptions import ClientError
import boto3

# ── Environment ──────────────────────────────────────────────────────────────
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "amazon.nova-lite-v1:0")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# ── CORS Headers ─────────────────────────────────────────────────────────────
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
}

# ── Bedrock System Prompt ─────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an AI file organization assistant.

Analyze the uploaded file.

Return ONLY valid JSON with no markdown, no code blocks, no extra text.

Schema:
{
  "original_name": "",
  "suggested_name": "",
  "category": "",
  "folder": "",
  "reason": ""
}

Rules:
- Preserve the original file extension exactly
- Use underscores instead of spaces in suggested_name
- Max 6 words in suggested_name
- category examples: Bills, Receipts, Personal, Photos, Development, University, Work, Finance, Medical, Travel, Miscellaneous
- folder examples: Documents/Bills, Projects/React, Pictures/Personal, Documents/University
- reason: one concise sentence explaining the suggestion
- Output only the JSON object, nothing else
"""

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def parse_multipart(event: dict) -> list:
    """Extract uploaded files from a multipart/form-data API Gateway event."""
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    content_type = headers.get("content-type", "")

    raw_body = event.get("body", "") or ""
    is_base64 = event.get("isBase64Encoded", False)

    if is_base64:
        body_bytes = base64.b64decode(raw_body)
    else:
        # Use latin-1 to preserve byte values when body is a string
        body_bytes = raw_body.encode("latin-1") if isinstance(raw_body, str) else raw_body

    # Reconstruct a full MIME message so the email parser can walk it
    full_message = f"Content-Type: {content_type}\r\n\r\n".encode("ascii") + body_bytes
    msg = BytesParser(policy=policy.compat32).parsebytes(full_message)

    files = []
    if msg.is_multipart():
        for part in msg.walk():
            content_disposition = part.get("Content-Disposition", "")
            if "form-data" not in content_disposition:
                continue
            # Extract filename from Content-Disposition header
            match = re.search(r'filename="([^"]+)"', content_disposition)
            if not match:
                continue
            filename = match.group(1)
            data = part.get_payload(decode=True)
            if data:
                files.append({"filename": filename, "data": data})
    return files


def validate_and_process(filename: str, data: bytes) -> dict:
    """Validate file and convert to the format Bedrock expects."""
    MAX_BYTES = 10 * 1024 * 1024  # 10 MB

    if len(data) > MAX_BYTES:
        raise ValueError(f"File too large (max 10 MB).")

    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    allowed = {".jpg", ".jpeg", ".png", ".pdf", ".txt"}

    if ext not in allowed:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: JPG, PNG, PDF, TXT.")

    if ext in (".jpg", ".jpeg", ".png"):
        fmt = "jpeg" if ext in (".jpg", ".jpeg") else "png"
        return {
            "type": "image",
            "format": fmt,
            "bytes": data,  # raw bytes for Bedrock multimodal
        }

    if ext == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(data))
            text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except Exception:
            text = ""
        return {"type": "text", "text": text[:3000] or f"[PDF file: {filename}]"}

    if ext == ".txt":
        text = data.decode("utf-8", errors="ignore")
        return {"type": "text", "text": text[:3000]}

    raise ValueError(f"Unhandled extension: {ext}")


def call_bedrock(filename: str, processed: dict) -> dict:
    """Send file content to Amazon Bedrock Nova Lite and return parsed result."""
    config = Config(
        connect_timeout=10,
        read_timeout=30,
        retries={"max_attempts": 1},
    )
    client = boto3.client("bedrock-runtime", region_name=AWS_REGION, config=config)

    user_content = []

    if processed["type"] == "text":
        user_content.append({
            "text": f"Original filename: {filename}\n\nFile content:\n{processed['text']}"
        })
    elif processed["type"] == "image":
        user_content.append({
            "text": f"Original filename: {filename}\nAnalyze this image and suggest how to organize it."
        })
        user_content.append({
            "image": {
                "format": processed["format"],
                "source": {"bytes": processed["bytes"]},
            }
        })

    bedrock_response = client.converse(
        modelId=BEDROCK_MODEL_ID,
        system=[{"text": SYSTEM_PROMPT}],
        messages=[{"role": "user", "content": user_content}],
        inferenceConfig={"maxTokens": 300, "temperature": 0.2},
    )

    output_text = bedrock_response["output"]["message"]["content"][0]["text"]
    return parse_bedrock_output(filename, output_text)


def parse_bedrock_output(filename: str, text: str) -> dict:
    """Extract and normalise the JSON object from Bedrock's response text."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", text).strip()

    match = re.search(r"\{.*?\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("Bedrock did not return valid JSON.")

    data = json.loads(match.group(0))

    # Ensure the suggested name preserves the original extension
    ext = ("." + filename.rsplit(".", 1)[-1]) if "." in filename else ""
    suggested = data.get("suggested_name") or filename
    if ext and not suggested.lower().endswith(ext.lower()):
        suggested = suggested.rstrip(".") + ext
    # Sanitise: replace spaces/hyphens with underscores
    suggested = re.sub(r"[\s\-]+", "_", suggested)

    return {
        "original_name": filename,
        "suggested_name": suggested,
        "category": data.get("category", "Miscellaneous"),
        "folder": data.get("folder", "Downloads/Misc"),
        "reason": data.get("reason", ""),
    }


# ── Lambda Handler ────────────────────────────────────────────────────────────

def handler(event, context):
    # Handle CORS pre-flight
    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method", "")
        .upper()
    )
    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # Health check
    path = event.get("rawPath", "") or event.get("path", "")
    if method == "GET" and path in ("/health", "/api/health"):
        return make_response(200, {"status": "healthy", "service": "FilePilot AI"})

    # Parse uploaded files
    try:
        files = parse_multipart(event)
    except Exception as exc:
        return make_response(400, {"error": f"Failed to parse upload: {exc}"})

    if not files:
        return make_response(400, {"error": "No files received. Upload at least one file."})

    if len(files) > 10:
        return make_response(400, {"error": "Maximum 10 files per request."})

    # Analyse each file
    results = []
    for f in files:
        filename = f["filename"]
        data = f["data"]

        try:
            processed = validate_and_process(filename, data)
        except ValueError as exc:
            results.append({"original_name": filename, "error": str(exc)})
            continue

        try:
            result = call_bedrock(filename, processed)
            results.append(result)
        except ClientError as exc:
            msg = exc.response["Error"].get("Message", str(exc))
            results.append({"original_name": filename, "error": f"Bedrock error: {msg}"})
        except Exception as exc:
            results.append({"original_name": filename, "error": str(exc)})

    return make_response(200, {"results": results})
