# 🌿 Wildlife Population Intelligence System (WildLife OS)

> **An AI-powered multi-modal platform for real-time wildlife monitoring, species identification, population estimation, spatial GIS intelligence, and automated conservation intervention.**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_7-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start with Docker Compose](#-quick-start-with-docker-compose)
- [Local Standalone Setup (Without Docker)](#-local-standalone-setup-without-docker)
- [Default Seed Accounts & Roles](#-default-seed-accounts--roles)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 📖 Overview

The **Wildlife Population Intelligence System (WildLife OS)** is a production-ready, full-stack intelligence platform built for wildlife researchers, forest rangers, conservationists, and administrative officers. It transforms unstructured multi-modal sensor streams (camera trap imagery and bioacoustic field audio recordings) into real-time spatial intelligence, biodiversity analytics, and prioritized conservation alerts.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Client ["Client Tier"]
        UI["React 18 Single Page Application<br/>(Tailwind CSS + Lucide Icons + Leaflet GIS)"]
    end

    subgraph Gateway ["Reverse Proxy Tier"]
        NGINX["Nginx Web Server<br/>(Port 3000)"]
    end

    subgraph ApplicationTier ["FastAPI Application Tier (Port 8000)"]
        API["FastAPI REST Engine & RBAC Middleware"]
        
        subgraph InferencePipelines ["Multi-Modal AI Inference Pipeline"]
            CV["2-Stage Computer Vision<br/>Stage 1: YOLOv8 Object Detection<br/>Stage 2: MobileNetV3-Small Classification"]
            AUDIO["Bioacoustics Audio Classifier<br/>Librosa Feature Extraction + YAMNet/BirdNET"]
        end

        subgraph AnalyticServices ["Analytics & Reporting Engines"]
            BIO["Biodiversity Engine (Shannon-Wiener H')"]
            HAB["Habitat Score Engine (5-Component Weighted)"]
            POP["Population Trends & Density Engine"]
            ALERT["Rule-Based Conservation Alert Engine"]
            REP["Automated PDF & Excel Exporters (ReportLab + OpenPyXL)"]
        end
    end

    subgraph DataTier ["Data Storage Tier"]
        PG[("PostgreSQL 16 + PostGIS<br/>Spatial Geometries, Species, Surveys, Users")]
        MDB[("MongoDB 7<br/>Unstructured Sensor Metadata & Audio Spectrograms")]
    end

    UI -->|HTTP / REST| NGINX
    NGINX -->|Proxy /api/ & /uploads/| API
    API --> CV
    API --> AUDIO
    API --> BIO & HAB & POP & ALERT & REP
    API -->|SQLAlchemy ORM + GeoAlchemy2| PG
    API -->|PyMongo Client| MDB
```

---

## ✨ Key Features

### 🧠 Multi-Modal AI Detection Pipelines
* **Two-Stage Computer Vision (Images)**:
  - **Stage 1 (YOLOv8)**: Fast object localization, isolating bounding box regions of animal instances.
  - **Stage 2 (MobileNetV3-Small / PyTorch)**: Deep feature classification cropped regions against target wildlife taxa (e.g., *Bengal Tiger*, *Asiatic Lion*, *Indian Elephant*, *Sloth Bear*).
* **Bioacoustics Spectral Audio Engine (Recordings)**:
  - Extracts acoustic feature representations (frequency centroid, zero-crossing rate, RMS energy, spectral flatness) via **Librosa**.
  - Classifies mammal calls, avian vocalizations (e.g., *Indian Peafowl*), human voice presence (anti-poaching indicators), and habitat ambient acoustics (rain, wind, thunder).

### 🗺️ Interactive Leaflet GIS & Spatial Analytics
* Visualizes monitoring sites with PostGIS spatial coordinates (`POINT(lng, lat)`).
* Interactive color-coded markers based on dynamic **Habitat Health Grades (A/B/C/D/F)**.
* Layer toggle for recent **Spatial Detection Events** color-coded by IUCN conservation status (Endangered, Vulnerable, Least Concern).

### 📊 Ecological Intelligence & Habitat Health
* **Shannon-Wiener Biodiversity Index ($H'$)**:
  $$H' = -\sum_{i=1}^{S} p_i \ln(p_i)$$
* **5-Component Weighted Habitat Scoring**:
  - Species Richness (25%)
  - Shannon-Wiener Diversity (20%)
  - Endangered Species Presence (20%)
  - Observation Activity Frequency (20%)
  - Temporal Recency Factor (15%)
* **30-Day Population Trajectories**: Computes per-species abundance, density proxies, and historical observation trends.

### 📄 PDF & Excel Reporting System
* **Field Survey Expedition PDF**: Comprehensive field summaries with detected species, observation lists, and site metadata.
* **Site Biodiversity Assessment PDF**: Formal ecological health reports with Shannon index scores, species distribution breakdown, and urgent conservation recommendations.
* **Excel Dataset Export (`.xlsx`)**: Formatted data exports with confidence scores, timestamps, and geographic coordinates.

### 🛡️ Role-Based Access Control (RBAC) & System Health
* 4 distinct user roles: `administrator`, `wildlife_researcher`, `conservation_officer`, `forest_department_officer`.
* Real-time `/api/system/health` diagnostics monitoring PostgreSQL connection, MongoDB connectivity, and service uptime.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Leaflet & React-Leaflet, Axios |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, GeoAlchemy2, PyMongo |
| **AI / ML** | PyTorch, Torchvision, Ultralytics YOLOv8, Librosa, NumPy, Pillow, OpenCV |
| **Databases** | PostgreSQL 16 (PostGIS 3.4), MongoDB 7 |
| **Reporting** | ReportLab (PDF generation), OpenPyXL (Excel generation) |
| **DevOps & Infrastructure** | Docker, Docker Compose, Nginx (Alpine) |

---

## 📁 Project Directory Structure

```text
wildlife-intelligence-system/
├── backend/
│   ├── app/
│   │   ├── api/                 # API Route Controllers
│   │   │   ├── analytics.py     # Biodiversity & aggregation endpoints
│   │   │   ├── auth.py          # User authentication & token issuance
│   │   │   ├── conservation.py  # Rule-based conservation recommendations
│   │   │   ├── gis.py           # Spatial GIS site & detection layers
│   │   │   ├── habitat.py       # Habitat scoring & grading endpoints
│   │   │   ├── health.py        # Site-level ecological health summary
│   │   │   ├── observations.py  # Observation upload & AI detection triggers
│   │   │   ├── population.py    # Population abundance & trend metrics
│   │   │   ├── reports.py       # PDF & Excel report export endpoints
│   │   │   ├── sites.py         # PostGIS monitoring site management
│   │   │   ├── species.py       # Taxonomic catalog CRUD
│   │   │   ├── surveys.py       # Survey expedition management
│   │   │   └── system.py        # System health & structured JSON logs
│   │   ├── core/                # Database & Security configs
│   │   │   ├── config.py        # Environment variables & constants
│   │   │   ├── database.py      # PostgreSQL / SQLAlchemy session setup
│   │   │   ├── deps.py          # Auth dependencies & RBAC guards
│   │   │   ├── geo.py           # PostGIS WKT spatial helpers
│   │   │   ├── mongo.py         # MongoDB connection & reconnect logic
│   │   │   └── security.py      # Passlib bcrypt & JWT token handlers
│   │   ├── models/              # SQLAlchemy database models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Core business logic & AI inference engines
│   │   │   ├── biodiversity_service.py
│   │   │   ├── conservation_service.py
│   │   │   ├── detection_service.py
│   │   │   ├── habitat_service.py
│   │   │   ├── population_service.py
│   │   │   ├── report_service.py
│   │   │   ├── site_service.py
│   │   │   ├── species_service.py
│   │   │   └── survey_service.py
│   │   └── main.py              # FastAPI application bootstrap & lifespan
│   ├── .env.example             # Backend environment template
│   ├── Dockerfile               # Backend Docker container recipe
│   ├── requirements.txt         # Python dependencies
│   └── seed_data.py             # Database seeder script
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client configuration
│   │   ├── components/          # Reusable UI components & modals
│   │   ├── context/             # AuthContext state provider
│   │   ├── pages/               # Role-based dashboard & feature views
│   │   ├── App.jsx              # Main routing & layout configuration
│   │   └── main.jsx             # React entry point
│   ├── Dockerfile               # Multi-stage frontend Docker build
│   ├── nginx.conf               # Nginx reverse proxy configuration
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite build configuration
├── docs/
│   └── user-guide.md            # Role-by-role user manual
├── docker-compose.yml           # Complete containerized multi-service stack
└── README.md                    # Project documentation
```

---

## 🚀 Quick Start with Docker Compose

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (installed and running)

### 1. Launch the Stack
Run the following command from the project root:
```bash
docker compose up --build -d
```

This starts all four services:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL (PostGIS)**: `localhost:5433` (Container port: `5432`)
- **MongoDB**: `localhost:27017`

### 2. Seed Initial Data
Seed monitoring sites, species, sample surveys, and test user accounts:
```bash
docker compose exec backend python seed_data.py
```

---

## 💻 Local Standalone Setup (Without Docker)

If you prefer running services directly on your host machine:

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16 with PostGIS extension enabled
- MongoDB 7+

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env to set your local PostgreSQL & MongoDB credentials

# Seed the database
python seed_data.py

# Launch FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Default Seed Accounts & Roles

| Full Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Rushabh Desai** | `administrator` | `rushabhdesai78@gmail.com` | `wildlife123` |
| **Dr. Priya Sharma** | `wildlife_researcher` | `priya@wildlife.com` | `wildlife123` |
| **Rajan Mehta** | `conservation_officer` | `rajan@wildlife.com` | `wildlife123` |
| **Suresh Kumar** | `forest_department_officer` | `suresh@wildlife.com` | `wildlife123` |

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT bearer token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |

### 📍 Monitoring Sites (`/api/sites`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sites/` | List all monitoring sites | Authenticated |
| `POST` | `/api/sites/` | Create a new monitoring site | Admin / Forest Officer |
| `GET` | `/api/sites/{id}` | Get details for a specific site | Authenticated |
| `PUT` | `/api/sites/{id}` | Update monitoring site metadata | Admin / Forest Officer |
| `DELETE`| `/api/sites/{id}` | Delete a monitoring site | Administrator |

### 🦁 Species Catalog (`/api/species`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/species/` | List all cataloged species | Authenticated |
| `POST` | `/api/species/` | Add a new species entry | Admin / Researcher |
| `GET` | `/api/species/{id}` | Get species information | Authenticated |
| `PUT` | `/api/species/{id}` | Update species classification | Admin / Researcher |
| `DELETE`| `/api/species/{id}` | Remove a species record | Administrator |

### 📷 Observations & AI Inference (`/api/observations`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/observations/` | Upload raw image/audio observation | Authenticated |
| `POST` | `/api/observations/{id}/detect` | Run YOLOv8/MobileNetV3 or Audio AI detection | Authenticated |
| `GET` | `/api/observations/{id}/detections` | Retrieve detection bounding boxes & classifications | Authenticated |

### 🗺️ GIS Mapping (`/api/gis`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gis/sites` | GeoJSON site markers with habitat score grades | Authenticated |
| `GET` | `/api/gis/detections` | Spatial detection points with date/species filters | Authenticated |

### 📈 Population & Habitat Analytics
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/population/site/{id}/summary` | 30-day species population metrics & trends | Authenticated |
| `GET` | `/api/habitat/site/{id}/score` | 5-component weighted habitat score & grade | Authenticated |
| `GET` | `/api/health/site/{id}/summary` | Comprehensive site ecological health dashboard | Authenticated |
| `GET` | `/api/conservation/recommendations/all` | Priority-sorted conservation intervention alerts | Authenticated |

### 📄 Reports & Downloads (`/api/reports`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/survey/{id}/pdf` | Download Field Survey PDF Report | Authenticated |
| `GET` | `/api/reports/site/{id}/biodiversity/pdf` | Download Site Biodiversity Assessment PDF | Authenticated |
| `GET` | `/api/reports/detections/excel` | Export filtered detections to Excel (`.xlsx`) | Authenticated |

### 🩺 System Diagnostics (`/api/system`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/system/health` | PostgreSQL, MongoDB connectivity & uptime | Public |

---

## 🛡️ Role-Based Access Control (RBAC)

Detailed role workflows are documented in [`docs/user-guide.md`](file:///d:/dell/wildlife-intelligence-system/docs/user-guide.md).

- **`administrator`**: Global access across all resources, configuration, and user permissions.
- **`wildlife_researcher`**: Focuses on species cataloging, observation uploads, AI inference verification, and biodiversity reports.
- **`conservation_officer`**: Focuses on active intervention alerts, habitat degradation tracking, and priority species protection.
- **`forest_department_officer`**: Focuses on spatial GIS mapping, monitoring site coverage, and anti-poaching activity oversight.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

```env
# Database Connections
DATABASE_URL=postgresql://wildlife:wildlife_pass@postgres:5432/wildlife_db
MONGO_URL=mongodb://wildlife:wildlife_pass@mongo:27017/?authSource=admin
MONGO_DB_NAME=wildlife_metadata

# JWT Authentication
SECRET_KEY=your-secure-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Model Inference
MODEL_WEIGHTS_PATH=yolov8n.pt
DETECTION_CONFIDENCE_THRESHOLD=0.25
```

### Frontend (`frontend/.env`)

```env
# Optional: Specify backend endpoint for non-Nginx dev setups
VITE_API_URL=
```

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.
