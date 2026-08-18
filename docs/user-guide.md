# 🌿 WildLife OS — User Guide by Role

Welcome to the **Wildlife Population Intelligence System**. This guide provides role-specific instructions for each authorized user persona.

---

## 1. 🔬 Wildlife Researcher (`wildlife_researcher`)

### Purpose & Capabilities
As a Wildlife Researcher, your primary focus is species cataloging, population trend analysis, biodiversity index calculation, and exporting research data.

### Key Workflows:
1. **Species Cataloging**:
   - Navigate to `/species` to view the comprehensive species directory.
   - Inspect conservation status, taxonomic class, and endangered flags.
2. **Field Observations & AI Detection**:
   - Navigate to `/observations` to upload camera trap images (`.jpg`, `.png`) or bioacoustic audio files (`.mp3`, `.wav`).
   - Click **Run Detection** to execute the multi-modal AI classification engine and inspect confidence scores.
3. **Population Analytics**:
   - Access `/population` to view 30-day species trends, density proxies, and 6-month historical time series charts.
4. **PDF Reports & Raw Data Export**:
   - Go to `/reports` to download formal **Field Survey PDF Reports** and **Site Biodiversity Assessment PDFs**, or export raw detection datasets as Excel `.xlsx` files.

---

## 2. 🛡️ Conservation Officer (`conservation_officer`)

### Purpose & Capabilities
As a Conservation Officer, your primary focus is threat monitoring, habitat degradation prevention, tracking endangered species, and acting on rule-based conservation recommendations.

### Key Workflows:
1. **Active Conservation Alerts Feed**:
   - Access `/conservation` or click **Active Alerts** on the Dashboard to review priority-sorted intervention recommendations (`critical`, `urgent`, `high`, `medium`, `low`).
2. **Habitat Score & Grade Tracking**:
   - View `/sites` or `/biodiversity` to monitor habitat health scores (0–100) and grades (A–F) computed across 5 ecological components.
3. **Endangered Species Monitoring**:
   - Monitor sites where endangered species populations show declining 30-day trends.

---

## 3. 🌲 Forest Department Officer (`forest_department_officer`)

### Purpose & Capabilities
As a Forest Department Officer, your focus is protected-area management, spatial tracking of wildlife movements, equipment activity monitoring, and patrol planning.

### Key Workflows:
1. **Interactive Leaflet GIS Map**:
   - Navigate to `/map` to view monitoring site markers color-coded by habitat grade.
   - Toggle the **Detections Layer ON** to view spatial detection events color-coded by endangered status.
2. **Patrol & Inactivity Alerts**:
   - Monitor sites flagging 30 days without wildlife activity to schedule physical sensor maintenance patrols.
3. **Protected Area Overviews**:
   - Review survey counts and recent detection logs per protected forest zone.

---

## 4. 👑 Administrator (`administrator`)

### Purpose & Capabilities
As an Administrator, you possess full system control including user management, site and survey creation, infrastructure health checks, and global system configuration.

### Key Workflows:
1. **System Health Check**:
   - View the **Infrastructure Health Card** on `/` (Dashboard) or query `/api/system/health` to monitor PostgreSQL connectivity, MongoDB metadata status, and container uptime.
2. **Site & Survey Management**:
   - Create and edit monitoring sites (`/sites`) with PostGIS spatial coordinates and device types.
   - Initialize new field survey expeditions (`/surveys`).
3. **Role & Species Administration**:
   - Add, edit, or remove species records (`/species`).
   - Enforce Role-Based Access Control (RBAC) security across all endpoints.
