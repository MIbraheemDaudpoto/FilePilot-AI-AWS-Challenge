# FilePilot AI ✈️

> **Turn messy downloads into organized files in seconds.**

Built for the **AWS Builder Weekend Challenge**.

---

## 🌟 Overview

**FilePilot AI** is a lightweight, AI-powered web application designed to reduce friction in managing downloaded files. Upload any unorganized file (Screenshot, PDF utility bill, text file), and Amazon Bedrock will analyze the content and instantly recommend:

1. **Descriptive Filename** (Preserving extension, under 6 words, underscores instead of spaces)
2. **File Category** (e.g., Bills, Work, Personal, Development, University)
3. **Suggested Target Folder** (e.g., `Documents/Bills`, `Projects/React`)
4. **Short AI Reasoning** (One-sentence clear rationale)
5. **AI Confidence Score** (Estimated confidence percentage)
6. **Visual Folder Hierarchy Tree Preview** (Rendering organized filesystem paths)
7. **Downloads Category Breakdown** (Aggregated counts by folder)

---

## 📐 AWS Architecture

```text
            User
              │
              ▼
      React + Tailwind (Frontend)
       (Deployed on AWS Amplify)
              │
              ▼
   Amazon API Gateway / FastAPI
              │
              ▼
 AWS Lambda (FastAPI + Mangum / Python 3.12)
              │
              ▼
  Amazon Bedrock (Amazon Nova Lite / Nova Models)
              │
              ▼
    Structured JSON Output
              │
              ▼
 Suggested Filename | Category | Folder | Reason | Confidence
```

### AWS Components Used:
- **Amazon Bedrock**: Powering fast text & multimodal content analysis using Amazon Nova models (`us.amazon.nova-lite-v1:0` or `amazon.nova-lite-v1:0`).
- **AWS Amplify**: Hosting the responsive React + TypeScript frontend with instant CI/CD deployment.
- **AWS Lambda & Amazon API Gateway**: Serverless backend running FastAPI via the `Mangum` ASGI adapter.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- **Python**: 3.12+
- **Node.js**: v18+ & npm
- **AWS Credentials**: (Optional for local testing; configure `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)

### 2. Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set environment variables in .env file or environment
export BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
export AWS_REGION=us-east-1

# Start local FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend server will run at `http://127.0.0.1:8000`. You can inspect interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 📡 API Specification

### `POST /api/v1/analyze`

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**: `files[]` (Array of files up to 10 MB each. Supported extensions: `.jpg`, `.jpeg`, `.png`, `.pdf`, `.txt`)

#### Response (`200 OK`)
```json
[
  {
    "original_name": "Screenshot (12).png",
    "suggested_name": "React_Login_Error.png",
    "category": "Development",
    "folder": "Projects/React",
    "reason": "The screenshot shows a React application login runtime exception.",
    "confidence": 0.95
  },
  {
    "original_name": "scan.pdf",
    "suggested_name": "Electricity_Bill_July_2026.pdf",
    "category": "Bills",
    "folder": "Documents/Bills",
    "reason": "The document contains an electricity utility bill for July 2026.",
    "confidence": 0.94
  }
]
```

#### Error Handling (`400 Bad Request` / `500 Internal Server Error`)
If AWS credentials or Amazon Bedrock model access is not configured:
```json
{
  "detail": "Amazon Bedrock is not configured. AWS credentials missing. Please configure AWS credentials."
}
```

---

## ☁️ AWS Deployment Instructions

### Deploying Frontend to AWS Amplify
1. Push your repository to GitHub.
2. Open the **AWS Amplify Console**.
3. Click **Create new app** -> **Host web app**.
4. Select GitHub, authorize, and choose your repository & branch.
5. Set `frontend` as the root build directory in `amplify.yml`:
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           build:
             commands:
               - npm ci
               - npm run build
         artifacts:
           baseDirectory: dist
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```
6. Add environment variable `VITE_API_URL` pointing to your deployed Amazon API Gateway endpoint.
7. Click **Save and Deploy**.

### Deploying Backend to AWS Lambda & API Gateway
1. Package the backend application:
   ```bash
   cd backend
   pip install --target ./package -r requirements.txt
   cd package && zip -r ../lambda.zip . && cd ..
   zip -g lambda.zip -r app lambda_function.py
   ```
2. In the **AWS Lambda Console**:
   - Create a new Python 3.12 function.
   - Set handler to `lambda_function.handler`.
   - Upload `lambda.zip`.
   - Under IAM Roles, attach `AmazonBedrockFullAccess` policy.
3. In **Amazon API Gateway Console**:
   - Create an HTTP API.
   - Set integration to your AWS Lambda function.
   - Route `ANY /{proxy+}` to the Lambda integration.
   - Deploy API and copy the API endpoint URL.

---

## 📜 License
MIT License. Built for the AWS Builder Weekend Challenge.
