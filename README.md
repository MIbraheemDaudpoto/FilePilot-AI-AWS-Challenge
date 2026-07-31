# FilePilot AI ✈️

> **Turn messy downloads into organized files in seconds.**

Built for the **AWS Builder Weekend Challenge** — using Amazon Bedrock, AWS Lambda, Amazon API Gateway, and AWS Amplify.

---

## 🌟 What It Does

**FilePilot AI** is a lightweight, AI-powered web application that reduces the friction of managing downloaded files. Upload any unorganized file (screenshot, PDF utility bill, text file), and Amazon Bedrock analyzes the content and instantly recommends:

| Output | Example |
|---|---|
| **Descriptive Filename** | `Electricity_Bill_July_2026.pdf` |
| **File Category** | `Bills` |
| **Suggested Folder** | `Documents/Bills` |
| **AI Reasoning** | *"Document contains an electricity utility bill for July 2026."* |
| **Confidence Score** | `94%` |
| **Folder Tree Preview** | Visual hierarchy of where the file belongs |

---

## 📐 AWS Architecture

```
                User
                  │
                  ▼
        AWS Amplify (React + Vite)
                  │  HTTPS
                  ▼
        Amazon API Gateway (HTTP API)
                  │  ANY /{proxy+}
                  ▼
      AWS Lambda (FastAPI + Mangum)
       Python 3.12 · lambda_function.handler
                  │
                  ▼
    Amazon Bedrock (Amazon Nova Lite)
      Multimodal · Text + Image analysis
                  │
                  ▼
        Structured JSON Response
                  │
                  ▼
            React UI Result Card
```

### AWS Services Used

| Service | Role |
|---|---|
| **Amazon Bedrock** | AI analysis using Amazon Nova Lite (`us.amazon.nova-lite-v1:0`) — multimodal text & image |
| **AWS Lambda** | Serverless Python 3.12 runtime running FastAPI via Mangum ASGI adapter |
| **Amazon API Gateway** | HTTP API with `ANY /{proxy+}` route → Lambda integration |
| **AWS Amplify** | Hosts the React + Vite frontend with CI/CD from GitHub |

---

## 🚀 Local Development

### Prerequisites
- Python 3.12+
- Node.js v18+ & npm
- AWS credentials configured (for Bedrock access)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# Activate (macOS / Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Start local development server
python -m uvicorn app.main:app --reload --port 8000
```

FastAPI runs at `http://127.0.0.1:8000`  
Interactive docs at `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux
# Set VITE_API_URL=http://localhost:8000 for local dev

# Start Vite development server
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## ☁️ AWS Deployment

### Step 1 — Deploy Backend to AWS Lambda

#### 1a. Package the Lambda deployment zip

```bash
cd backend

# Install dependencies into ./package/
pip install --target ./package -r requirements.txt

# Windows (PowerShell)
Compress-Archive -Path .\package\* -DestinationPath lambda.zip
Compress-Archive -Path .\app, .\lambda_function.py -Update -DestinationPath lambda.zip

# macOS / Linux
cd package && zip -r ../lambda.zip . && cd ..
zip -g lambda.zip -r app lambda_function.py
```

#### 1b. Create the Lambda function

1. Open **AWS Lambda Console** → **Create function**
2. Runtime: **Python 3.12**
3. Upload `lambda.zip` (or use S3 for large zips)
4. **Handler**: `lambda_function.handler`
5. **Memory**: 512 MB · **Timeout**: 30 seconds
6. **IAM Role**: attach `AmazonBedrockFullAccess` policy

#### 1c. Set Lambda environment variables

| Variable | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `us.amazon.nova-lite-v1:0` |
| `GROQ_API_KEY` | *(optional fallback)* |

> ⚠️ Do **not** set `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` on Lambda — use the IAM execution role instead.

---

### Step 2 — Create Amazon API Gateway HTTP API

1. Open **Amazon API Gateway Console** → **Create API** → **HTTP API**
2. Add integration: **Lambda** → select your `FilePilot-AI` function
3. Add route: `ANY` → `/{proxy+}`
4. Stage: `$default` (auto-deploy)
5. Copy the **Invoke URL** (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com`)

---

### Step 3 — Deploy Frontend to AWS Amplify

1. Push your repo to GitHub
2. Open **AWS Amplify Console** → **Create new app** → **Host web app**
3. Connect GitHub → select `FilePilot-AI-AWS-Challenge` repo → branch `main`
4. Amplify detects Vite automatically. Confirm build settings:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
```

5. Add environment variable in Amplify:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://abc123.execute-api.us-east-1.amazonaws.com` |

6. Click **Save and deploy** → Amplify builds and publishes automatically

---

## 📡 API Reference

### `GET /health`
Health check — returns `{"status": "healthy"}`.

### `POST /api/v1/analyze`

**Request:** `multipart/form-data` with `files[]` field  
**Supported types:** `.jpg`, `.jpeg`, `.png`, `.pdf`, `.txt`  
**Max file size:** 10 MB · **Max files per request:** 10

**Response:**
```json
[
  {
    "original_name": "Screenshot (12).png",
    "suggested_name": "React_Login_Error.png",
    "filename": "React_Login_Error.png",
    "category": "Development",
    "folder": "Projects/React",
    "suggested_folder": "Projects/React",
    "tags": ["react", "error", "screenshot", "code"],
    "summary": "The screenshot shows a React application login runtime exception.",
    "confidence": 0.95,
    "provider_used": "bedrock"
  }
]
```

---

## 🔒 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AWS_REGION` | ✅ | AWS region (use `us-east-1` for Nova models) |
| `BEDROCK_MODEL_ID` | ✅ | Model ID (e.g. `us.amazon.nova-lite-v1:0`) |
| `AWS_ACCESS_KEY_ID` | Local only | AWS credentials (use IAM role on Lambda) |
| `AWS_SECRET_ACCESS_KEY` | Local only | AWS credentials (use IAM role on Lambda) |
| `GROQ_API_KEY` | Optional | Fallback provider if Bedrock unavailable |
| `VITE_API_URL` | Frontend | API Gateway invoke URL |

> 🚫 **Never commit `.env` files.** They are in `.gitignore`.  
> ✅ Use `.env.example` files as templates.

---

## 🛡️ Resilient AI Provider Chain

If Amazon Bedrock is unavailable or rate-limited, the backend automatically falls back:

```
1. Amazon Bedrock (Amazon Nova Lite)  ← primary, 3s timeout
       ↓ (if fails)
2. Groq API (llama-3.3-70b)           ← secondary, if GROQ_API_KEY set
       ↓ (if fails)
3. Mock Fallback Engine               ← always works, rule-based
```

---

## 📜 License

MIT License. Built for the **AWS Builder Weekend Challenge**.
