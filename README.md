<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/AWS-Cloud_Native-FF9900?logo=amazonaws&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white&style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

# ☁️ CloudVault — Secure Cloud File Management System

**CloudVault** is a full-stack, cloud-native file management platform built on **AWS**. It enables authenticated users to securely upload, download, version-control, and manage files in the cloud through an intuitive React dashboard — powered by **Amazon S3**, **DynamoDB**, **Cognito**, and **EC2**.

---

## 🎯 Key Features

| Feature | Description |
|---|---|
| **🔐 User Authentication** | Secure sign-up, sign-in, and email verification via AWS Cognito (JWT-based) |
| **📤 File Upload** | Drag-and-drop + click-to-browse upload with real-time progress tracking (up to 50 MB) |
| **📥 Secure Download** | Pre-signed S3 URLs with 5-minute expiry for secure, time-limited file access |
| **📂 File Listing** | Dashboard view with file name, size, last modified date, and per-user namespace isolation |
| **🗑️ File Deletion** | Delete files from S3 with automatic DynamoDB metadata cleanup |
| **📜 Version History** | Full version history (V1, V2, V3…) leveraging S3 bucket versioning |
| **🔄 Version Restore** | One-click restore of any previous version — copies old version as new latest |
| **🛡️ Server-Side Encryption** | All files encrypted at rest using AES-256 (S3 SSE) |
| **📊 Storage Dashboard** | Real-time stats showing total files and aggregate storage used |
| **🌐 Cross-Region Replication** | Primary and replica S3 buckets configured for data redundancy |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│                     React 18 + Tailwind CSS                      │
│            AWS Amplify Auth (Cognito) + Axios HTTP               │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS (Bearer JWT)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (EC2 Instance)                       │
│        Node.js + Express (Docker Container / Docker Compose)     │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Routes   │→ │  Middleware   │→ │      Controllers         │  │
│  │ /api/files │  │ JWT Verify   │  │ fileController            │  │
│  │            │  │ Error Handler│  │ versionController         │  │
│  └────────────┘  └──────────────┘  └────────────┬─────────────┘  │
│                                                  │               │
│                                    ┌─────────────▼─────────────┐ │
│                                    │     S3 Helper (Utils)     │ │
│                                    │ upload · list · download  │ │
│                                    │ delete · versions · restore│ │
│                                    └─────────────┬─────────────┘ │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                 ┌─────────────────────────────────┼─────────────────────────┐
                 │                                 │                         │
                 ▼                                 ▼                         ▼
     ┌───────────────────┐             ┌───────────────────┐    ┌────────────────────┐
     │   Amazon S3       │             │  Amazon DynamoDB   │    │  Amazon Cognito    │
     │ (Primary Bucket)  │             │  (FileMetadata)    │    │  (User Pool)       │
     │ + Versioning      │             │  userId (PK)       │    │  JWT Tokens        │
     │ + SSE-AES256      │             │  fileKey (SK)       │    │  JWKS Endpoint     │
     │ + CRR → Replica   │             │  fileName, size,   │    │  Email Verification│
     └───────────────────┘             │  mimeType, version │    └────────────────────┘
                                       └───────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI framework |
| **React Router v6** | Client-side routing with protected/public routes |
| **Tailwind CSS 3.4** | Utility-first CSS framework |
| **AWS Amplify v6** | Cognito authentication integration |
| **Axios** | HTTP client with JWT interceptor |
| **Lucide React** | Modern icon library |
| **Headless UI** | Accessible UI primitives |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express 4** | Minimal, fast web framework |
| **AWS SDK v2** | S3, DynamoDB, Cognito integration |
| **express-jwt + jwks-rsa** | Cognito JWT verification via JWKS endpoint |
| **Multer** | Multipart file upload handling (memory storage) |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |
| **Docker & Compose** | Containerization & multi-service orchestration |
| **Nginx (Alpine)** | Static file web server & SPA router (Frontend container) |
| **PM2** | Alternative process manager for non-containerized environments |

### AWS Services
| Service | Role |
|---|---|
| **Amazon EC2** | Hosts the backend API server |
| **Amazon S3** | Object storage with versioning & server-side encryption |
| **Amazon DynamoDB** | NoSQL metadata store (file attributes, version tracking) |
| **Amazon Cognito** | User authentication, registration, and email verification |
| **IAM Roles** | Credential-free access from EC2 to AWS services |
| **S3 Cross-Region Replication** | Data redundancy across AWS regions |

---

## 📡 API Endpoints

All routes are prefixed with `/api/files` and **require a valid Cognito JWT** in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (public — no auth required) |
| `POST` | `/api/files/upload` | Upload a file (multipart/form-data, max 50 MB) |
| `GET` | `/api/files/list` | List all files for the authenticated user |
| `GET` | `/api/files/download/:fileName` | Get a pre-signed download URL (5-min expiry) |
| `DELETE` | `/api/files/delete/:fileName` | Delete a file and its metadata |
| `GET` | `/api/files/versions/:fileName` | List all versions of a file (V1, V2, V3…) |
| `POST` | `/api/files/restore/:fileName/:versionId` | Restore a previous version as the new latest |

### Query Parameters
| Endpoint | Param | Description |
|---|---|---|
| `GET /download/:fileName` | `?versionId=...` | Download a specific version instead of latest |

---
## 🚀 Production Deployment on AWS EC2 (Docker & Docker Compose)

CloudVault is containerized using **Docker & Docker Compose** for streamlined, repeatable deployment on an **AWS EC2** instance with zero environment discrepancies.

### 1. AWS Infrastructure Prerequisites

#### A. Create an IAM Instance Role (Zero-Credential Architecture)
Instead of embedding AWS access keys in `.env` files on the EC2 instance, create an IAM Role:
1. Navigate to **AWS IAM Console** → **Roles** → **Create Role**.
2. Select **AWS Service** → **EC2**.
3. Attach policies granting access to CloudVault resources:
   - `AmazonS3FullAccess` (or scoped policy for primary and replica buckets)
   - `AmazonDynamoDBFullAccess` (or scoped policy for `FileMetadata` table)
   - `AmazonCognitoReadOnly`
4. Name the role `CloudVault-EC2-Role` and save.

#### B. Launch EC2 Instance & Configure Security Group
1. Launch an **Ubuntu 24.04 LTS** or **Amazon Linux 2023** instance (e.g., `t3.micro` or `t2.micro` Free Tier eligible).
2. Attach the **IAM instance profile**: `CloudVault-EC2-Role`.
3. In the **Security Group**, configure inbound rules:
   | Protocol | Port | Source | Description |
   |---|---|---|---|
   | **SSH** | `22` | `My IP` | Secure remote shell access |
   | **HTTP** | `80` | `0.0.0.0/0` | Web dashboard traffic (if routed through port 80) |
   | **Custom TCP** | `3000` | `0.0.0.0/0` | Frontend React UI container |
   | **Custom TCP** | `5000` | `0.0.0.0/0` | Backend Express API container |

---

### 2. Connect and Install Docker on EC2

SSH into your EC2 instance:
```bash
chmod 400 cloudvault-key.pem
ssh -i "cloudvault-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

Install Docker and the Docker Compose plugin:
```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Docker engine and Compose plugin
sudo apt install -y docker.io docker-compose-v2 git

# Allow ubuntu user to execute docker commands without sudo
sudo usermod -aG docker ubuntu
newgrp docker
```

---

### 3. Clone Repository & Configure Environment

```bash
git clone https://github.com/your-username/cloudvault.git
cd cloudvault
```

#### A. Configure Backend `.env`
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Populate with your AWS resource identifiers (*Note: AWS credentials are not needed because EC2 assumes the IAM Role automatically*):
```env
PORT=5000
AWS_REGION=us-east-1
S3_PRIMARY_BUCKET=cloudvault-primary
S3_REPLICA_BUCKET=cloudvault-replica
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id
DYNAMODB_TABLE=FileMetadata
FRONTEND_URL=http://<YOUR_EC2_PUBLIC_IP>:3000
```

#### B. Set Frontend Build-Time Variables
Export the environment variables used during the frontend image build:
```bash
export REACT_APP_API_URL=http://<YOUR_EC2_PUBLIC_IP>:5000
export REACT_APP_AWS_REGION=us-east-1
export REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
export REACT_APP_USER_POOL_CLIENT_ID=your-cognito-client-id
```

---

### 4. Build and Run Containers

Launch both the frontend (Nginx Alpine) and backend (Node.js Alpine) containers in detached mode:

```bash
docker compose up --build -d
```

Verify service status and healthchecks:
```bash
# Check container status
docker compose ps

# Inspect live logs
docker compose logs -f
```

The application is now live:
* **Frontend Dashboard:** `http://<YOUR_EC2_PUBLIC_IP>:3000`
* **Backend API Health:** `http://<YOUR_EC2_PUBLIC_IP>:5000/health`

---

### 5. Updating the Deployment (Zero Downtime Updates)

Whenever you push new code to your repository:
```bash
cd cloudvault
git pull origin main
docker compose up --build -d
docker image prune -f
```


---

## 📁 Project Structure

```
cloudvault/
├── backend/
│   ├── src/
│   │   ├── app.js                          # Express entry point, global middleware, routes
│   │   ├── config/
│   │   │   └── aws.js                      # AWS SDK config (S3, DynamoDB clients)
│   │   ├── controllers/
│   │   │   ├── fileController.js           # Upload, list, download, delete handlers
│   │   │   └── versionController.js        # Version listing and restore handlers
│   │   ├── middleware/
│   │   │   ├── auth.js                     # Cognito JWT verification (JWKS-based)
│   │   │   └── errorHandler.js             # Global error handler (401, 400, 413, 500)
│   │   ├── routes/
│   │   │   └── files.js                    # File & version route definitions
│   │   └── utils/
│   │       └── s3Helper.js                 # S3 operations (upload, list, versions, etc.)
│   ├── Dockerfile                          # Lightweight Node.js 18 Alpine image
│   ├── .dockerignore
│   ├── ecosystem.config.js                 # PM2 process manager configuration
│   ├── package.json
│   └── .env.example                        # Environment variable template
│
├── frontend/
│   ├── public/
│   │   └── index.html                      # HTML entry point
│   ├── src/
│   │   ├── App.jsx                         # Root component with routing + auth guards
│   │   ├── aws-exports.js                  # AWS Amplify configuration
│   │   ├── index.js                        # React DOM entry point
│   │   ├── index.css                       # Tailwind CSS imports + base styles
│   │   ├── context/
│   │   │   └── AuthContext.jsx             # Auth state management (login, register, etc.)
│   │   ├── services/
│   │   │   └── api.js                      # Axios instance + API functions
│   │   └── components/
│   │       ├── Auth/
│   │       │   └── LoginPage.jsx           # Login / Register / Email verification UI
│   │       ├── Dashboard/
│   │       │   ├── Dashboard.jsx           # Main dashboard with stats + file management
│   │       │   ├── FileTable.jsx           # File list table with actions
│   │       │   ├── UploadButton.jsx        # Drag-and-drop upload with progress bar
│   │       │   └── VersionsModal.jsx       # Version history modal (download/restore)
│   │       └── Layout/
│   │           └── Navbar.jsx              # Top navigation bar
│   ├── Dockerfile                          # Multi-stage build (Node build -> Nginx Alpine)
│   ├── nginx.conf                          # Nginx SPA router & cache headers
│   ├── .dockerignore
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── .env.example                        # Environment variable template
│
├── docker-compose.yml                      # Full-stack container orchestration
├── .dockerignore
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- **Docker** and **Docker Compose** (or Node.js v18+ and npm for manual local setup)
- An **AWS Account** with the following resources provisioned:
  - **S3 Bucket** with versioning enabled
  - **DynamoDB Table** (`FileMetadata`) with partition key `userId` (String) and sort key `fileKey` (String)
  - **Cognito User Pool** with email-based sign-up
  - **EC2 Instance** with an IAM role granting S3, DynamoDB, and Cognito access

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/cloudvault.git
cd cloudvault
```

### 🐳 Quick Start with Docker (Recommended)

Start both the frontend and backend with a single command:

```bash
# Build and run containers
docker compose up --build -d

# View live service logs
docker compose logs -f

# Tear down containers
docker compose down
```

* **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:5000](http://localhost:5000)
* **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

---

### 💻 Manual Local Setup (Alternative)

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your AWS resource IDs
```

**`.env` Configuration:**
```env
PORT=5000
AWS_REGION=us-east-1
S3_PRIMARY_BUCKET=cloudvault-primary
S3_REPLICA_BUCKET=cloudvault-replica
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-cognito-client-id
DYNAMODB_TABLE=FileMetadata
FRONTEND_URL=http://localhost:3000
```

**Start the backend:**
```bash
# Development (with auto-reload)
npm run dev

# Production (with PM2)
npx pm2 start ecosystem.config.js --env production
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API URL and Cognito details
```

**`.env` Configuration:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_CLIENT_ID=your-cognito-client-id
```

**Start the frontend:**
```bash
npm start
```

The app will be available at **http://localhost:3000**.

---

## 🔒 Security Practices

| Practice | Implementation |
|---|---|
| **JWT Authentication** | All API routes protected by Cognito JWT verification via JWKS endpoint |
| **CORS** | Configured to allow only the frontend origin |
| **Helmet** | Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.) |
| **Server-Side Encryption** | All S3 objects encrypted at rest with AES-256 |
| **IAM Roles** | EC2 uses instance-attached IAM roles — no hardcoded AWS credentials |
| **Pre-Signed URLs** | Download URLs expire after 5 minutes |
| **User Isolation** | Files are namespaced per user (`userId/fileName`) — users can only access their own files |
| **Input Validation** | File size limits (50 MB), required parameter checks, and typed error handling |
| **Request Logging** | All HTTP requests logged via Morgan (combined format) |

---


## 📝 License

This project is licensed under the **MIT License**.

---

<p align="center">
  <b>Built by Ayush Sharma</b><br/>
  <sub>Powered by AWS · EC2 · S3 · Cognito · DynamoDB</sub>
</p>
