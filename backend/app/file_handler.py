import io
import base64
from typing import Dict, Any, Tuple
from pypdf import PdfReader
from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".txt"}

def validate_file(file: UploadFile, content: bytes) -> str:
    """Validates file extension and size limit (10MB). Returns normalized extension."""
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' exceeds the 10 MB maximum size limit."
        )
    
    filename = file.filename or "file"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: .jpg, .jpeg, .png, .pdf, .txt"
        )
    
    return ext

def process_file_content(file_name: str, ext: str, content: bytes) -> Dict[str, Any]:
    """
    Processes upload content according to file type:
    - Text/PDF: Extracts text content string
    - Image: Encodes image bytes as base64 payload for Bedrock Converse API
    """
    if ext == ".txt":
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1", errors="ignore")
        return {
            "type": "text",
            "text": text[:10000]  # cap text at 10k chars for fast processing
        }
    
    elif ext == ".pdf":
        try:
            reader = PdfReader(io.BytesIO(content))
            extracted_text = []
            for i, page in enumerate(reader.pages):
                if i >= 5:  # Inspect first 5 pages max
                    break
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
            
            full_text = "\n".join(extracted_text).strip()
            if not full_text:
                full_text = f"PDF Document named {file_name} containing unextractable raster graphics or empty pages."
            
            return {
                "type": "text",
                "text": full_text[:10000]
            }
        except Exception as e:
            return {
                "type": "text",
                "text": f"PDF Document titled {file_name} (Failed to parse page text: {str(e)})"
            }
            
    elif ext in {".jpg", ".jpeg", ".png"}:
        format_map = {
            ".jpg": "jpeg",
            ".jpeg": "jpeg",
            ".png": "png"
        }
        fmt = format_map.get(ext, "jpeg")
        return {
            "type": "image",
            "format": fmt,
            "bytes": content
        }
    
    return {
        "type": "text",
        "text": f"File named {file_name}"
    }
