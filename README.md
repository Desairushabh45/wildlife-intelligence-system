# 🌿 Wildlife Population Intelligence System (WildLife OS)

> **An AI-powered platform for real-time wildlife monitoring, species identification, population estimation, habitat intelligence, and conservation intervention.**

![System Stack](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_PostGIS-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 📋 Overview

The **Wildlife Population Intelligence System** is an end-to-end web platform designed for wildlife researchers, forest officers, and conservationists. It transforms raw multi-modal field observations (camera trap images and bioacoustic audio recordings) into actionable conservation intelligence using state-of-the-art AI inference pipelines, spatial analytics, and rule-based recommendation engines.

---

## ✨ Key Features

### 🧠 Multi-Modal AI Detection Engines
* **Two-Stage Computer Vision (Images)**: 
  - **Stage 1 (YOLOv8)**: Detects animal instances and extracts bounding boxes.
  - **Stage 2 (MobileNetV3-Small)**: Classifies cropped regions against ImageNet wildlife categories to identify species (e.g. Bengal Tiger, Asiatic Lion, Indian Elephant).
* **Two-Tier Bioacoustics (Audio)**:
  - **Primary Model (Cornell BirdNET)**: Analyzes spectrograms from `.mp3` / `.wav` audio files to classify bird species with high confidence.
  - **Fallback Model (Google YAMNet)**: Automatically triggered for non-bird sounds (roars, growls, trumpets) to capture general acoustic events.
* **4-Tier Species Database Resolver**: Normalizes raw model output tokens to database species records via exact matching, whole-phrase word boundaries, and token fallbacks.

### 📊 Population & Biodiversity Analytics
* **Shannon-Wiener Diversity Index ($H'$)**: Quantitative measure of species diversity and evenness per survey and monitoring site.
* **30-Day Trend & Density Engine**: Tracks 30-day population trends (`increasing`, `stable`, `declining`) and computes per-survey population density proxies.
* **6-Month Time Series**: Renders monthly population trend line charts for long-term ecological monitoring.

### 🛡️ Habitat & Ecosystem Health Intelligence
* **Habitat Score (0–100 & Grades A–F)**: 5-component weighted index evaluating:
  1. *Species Diversity* (30%)
  2. *Endangered Species Presence* (25%)
  3. *Detection Frequency* (20%)
  4. *Species Richness* (15%)
  5. *Survey Coverage* (10%)
* **Ecosystem Health Score**: Calculates composite ecosystem health scores with conservation status badges (`Excellent`, `Healthy`, `Moderate Concern`, `Vulnerable`, `Critical`).
* **Rule-Based Conservation Recommendations**: Automatically flags critical habitat degradation, declining endangered species populations, equipment inactivity, and high-biodiversity zones.

### 🔐 Auth & Security
* **JWT Authentication**: Role-Based Access Control (RBAC) with support for:
  - `administrator`
  - `wildlife_researcher`
  - `conservation_officer`
  - `forest_department_officer`

---

## 🏗️ Architecture & Stack

```
                                  ┌───────────────────────────────┐
                                  │      React 18 + Vite UI       │
                                  │ (TailwindCSS, Recharts, Lucide)│
                                  └───────────────┬───────────────┘
                                                  │ HTTP REST (JWT)
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │        FastAPI Backend        │
                                  └───────┬───────────────┬───────┘
                                          │               │
                  ┌───────────────────────┴─┐           ┌─┴───────────────────────┐
                  │ AI Inference Pipelines  │           │   Database Persistence  │
                  ├─────────────────────────┤           ├─────────────────────────┤
                  │ • YOLOv8 + MobileNetV3  │           │ • PostgreSQL + PostGIS  │
                  │ • BirdNET + Google YAMNet│          │ • MongoDB (Metadata)    │
                  └─────────────────────────┘           └─────────────────────────┘
```

* **Frontend**: React 18, Vite, TailwindCSS, Recharts, Lucide React, Axios.
* **Backend**: FastAPI, Python 3.11, SQLAlchemy, PyMongo, GeoAlchemy2, Uvicorn.
* **Databases**: PostgreSQL 16 + PostGIS 3.4 (Relational & Spatial), MongoDB 7 (Unstructured Metadata).
* **Containerization**: Docker & Docker Compose.

---

## 🚀 Quick Start Guide

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
* [Node.js](https://nodejs.org/) v18+ (for local frontend development)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Desairushabh45/wildlife-intelligence-system.git
cd wildlife-intelligence-system
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the backend directory:
```bash
cp backend/.env.example backend/.env
```

### 3. Launch Backend & Databases with Docker Compose
From the root directory, run:
```bash
docker compose up --build -d
```
This starts:
* **FastAPI Backend**: `http://localhost:8000`
* **Swagger API Documentation**: `http://localhost:8000/docs`
* **PostgreSQL (PostGIS)**: Port `5433`
* **MongoDB**: Port `27017`

### 4. Run Frontend Development Server
Navigate to the `frontend` directory, install dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Seed Sample Data

To populate the database with realistic sample sites, species, and surveys:
```bash
docker exec wildlife_backend python seed_data.py
```

### Default Credentials (Seeded Users):
* **Admin**: `admin@wildlife.com` / `wildlife123`
* **Researcher**: `priya@wildlife.com` / `wildlife123`
* **Conservation Officer**: `rajan@wildlife.com` / `wildlife123`
* **Forest Officer**: `suresh@wildlife.com` / `wildlife123`

---

## 📡 API Endpoints Summary

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new user |
| | `POST` | `/api/auth/login` | Login & receive JWT access token |
| | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Sites** | `GET` / `POST` | `/api/sites/` | List or create spatial monitoring sites |
| **Surveys** | `GET` / `POST` | `/api/surveys/` | List or create survey expeditions |
| **Observations**| `POST` | `/api/observations/` | Upload image/audio observation files |
| | `POST` | `/api/observations/{id}/detect` | Trigger AI species detection pipeline |
| **Population** | `GET` | `/api/population/site/{id}/summary` | Per-species 30d trends & count |
| | `GET` | `/api/population/site/{id}/trends` | 6-month monthly population time series |
| | `GET` | `/api/population/site/{id}/density` | Detections per survey density proxy |
| **Habitat** | `GET` | `/api/habitat/site/{id}/score` | 5-component weighted habitat score & grade |
| | `GET` | `/api/habitat/sites/rankings` | Rank all sites by habitat score |
| **Conservation**| `GET` | `/api/conservation/site/{id}/recommendations` | Site intervention alerts |
| | `GET` | `/api/conservation/recommendations/all` | Priority-sorted recommendation feed |
| **Health** | `GET` | `/api/health/site/{id}` | Composite ecosystem health index |

Full interactive API documentation is available at **`http://localhost:8000/docs`**.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
