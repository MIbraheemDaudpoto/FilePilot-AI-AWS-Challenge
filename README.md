# FilePilot AI ✈️

> **Turn messy downloads into organized files in seconds.**

Built for the **AWS Builder Weekend Challenge**.

---

## 🌟 What It Does

Most people download dozens of files every week — `IMG_2033.jpg`, `document.pdf`, `Screenshot (14).png` — and have no idea what they contain days later.

**FilePilot AI** fixes this. Upload any file and Amazon Bedrock (Nova Lite) instantly suggests:

| Output | Example |
|---|---|
| **Descriptive Filename** | `Passport_Photo.jpg` |
| **Category** | `Personal` |
| **Suggested Folder** | `Pictures/Personal` |
| **AI Reasoning** | *"Appears to be a passport-style portrait."* |

---

## 📐 Architecture

```
                User
                  │
                  ▼
        AWS Amplify (React + Vite)
                  │
                  ▼
     Amazon API Gateway (HTTP API)
                  │
                  ▼
   AWS Lambda (Python 3.12)
     lambda_function.handler
                  │
                  ▼
 Amazon Bedrock (Amazon Nova Lite)
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
| **Amazon Bedrock** | AI content analysis using Amazon Nova Lite — multimodal text & image |
| **AWS Lambda** | Serverless Python 3.12 handler — single function, no frameworks |
| **Amazon API Gateway** | HTTP API with `ANY /{proxy+}` → Lambda integration |
| **AWS Amplify** | Hosts the React + Vite + Tailwind frontend with CI/CD from GitHub |

---

## 📂 Folder Structure

```
AWS/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   └── FolderTree.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── lambda/
│   ├── lambda_function.py
│   └── requirements.txt
│
├── amplify.yml
└── README.md
```

---

## 🚀 Local Development

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env → VITE_API_URL=http://localhost:8000 (or your test endpoint)
npm run dev
```

### Lambda (test locally)

```bash
cd lambda
python -m venv venv
source venv/bin/activate    # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Test with a Lambda test event or use a tool like SAM CLI
```

---

## ☁️ AWS Deployment

### Step 1 — Deploy Lambda

#### Package

```bash
cd lambda

# Install deps into ./package
pip install --target ./package -r requirements.txt

# Create zip (macOS/Linux)
cd package && zip -r ../lambda.zip . && cd ..
zip -g lambda.zip lambda_function.py

# Create zip (Windows PowerShell)
Compress-Archive -Path .\package\* -DestinationPath lambda.zip -Force
Compress-Archive -Path .\lambda_function.py -Update -DestinationPath lambda.zip
```

#### Create Function

1. **AWS Console → Lambda → Create function**
2. Runtime: **Python 3.12**
3. Upload `lambda.zip`
4. Handler: `lambda_function.handler`
5. Memory: **512 MB** · Timeout: **30 seconds**
6. IAM Role → attach **`AmazonBedrockFullAccess`** policy

#### Environment Variables

| Key | Value |
|---|---|
| `AWS_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `amazon.nova-lite-v1:0` |

> ⚠️ Do **not** set AWS credentials on Lambda — use the IAM execution role.

---

### Step 2 — Create API Gateway

1. **API Gateway Console → Create API → HTTP API**
2. Add integration: **Lambda** → your function
3. Route: `ANY /{proxy+}`
4. Deploy → copy the **Invoke URL**

Verify:
```
GET https://<id>.execute-api.us-east-1.amazonaws.com/health
→ {"status": "healthy", "service": "FilePilot AI"}
```

---

### Step 3 — Deploy Frontend to Amplify

1. **Amplify Console → Create new app → Host web app**
2. Connect GitHub → select repo → branch `main`
3. Amplify detects `amplify.yml` automatically
4. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<id>.execute-api.us-east-1.amazonaws.com` |

5. Save and deploy

---

## 📡 API

### `POST /analyze`

**Request:** `multipart/form-data` with file fields  
**Supported:** `.jpg`, `.jpeg`, `.png`, `.pdf`, `.txt` · Max 10 MB · Max 10 files

**Response:**
```json
{
  "results": [
    {
      "original_name": "IMG_1022.jpg",
      "suggested_name": "Passport_Photo.jpg",
      "category": "Personal",
      "folder": "Pictures/Personal",
      "reason": "Appears to be a passport-style portrait."
    }
  ]
}
```

### `GET /health`

Returns `{"status": "healthy", "service": "FilePilot AI"}`

---

## 🔒 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `AWS_REGION` | Lambda | AWS region (`us-east-1`) |
| `BEDROCK_MODEL_ID` | Lambda | Model ID (`amazon.nova-lite-v1:0`) |
| `VITE_API_URL` | Amplify | API Gateway invoke URL |

> 🚫 Never commit `.env` files. They are in `.gitignore`.

---

## 📜 License

MIT License. Built for the **AWS Builder Weekend Challenge**.
