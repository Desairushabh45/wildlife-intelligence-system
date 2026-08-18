"""
population_service.py
======================
Service logic for Population Estimation Engine:
- Species population counts and trend analysis (last 30d vs prev 30d)
- Population density per survey proxy
- 6-month monthly population trend time series
"""

import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Detection, MonitoringSite, Observation, Species, Survey


def get_species_population_by_site(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Count total detections per species across all surveys at a given site.
    Calculates last_detected timestamp and population trend ("increasing", "stable", "declining").
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {"site_id": site_id, "site_name": None, "species_population": []}

    now = datetime.datetime.utcnow()
    thirty_days_ago = now - datetime.timedelta(days=30)
    sixty_days_ago = now - datetime.timedelta(days=60)

    # Base query joining Detections -> Observations -> Surveys -> Site
    base_q = (
        db.query(Detection, Observation, Survey)
        .join(Observation, Observation.id == Detection.observation_id)
        .join(Survey, Survey.id == Observation.survey_id)
        .filter(Survey.site_id == site_id)
    )

    all_rows = base_q.all()

    # Group rows by species_id or raw_label
    grouped: Dict[Optional[str], List[Any]] = {}
    for det, obs, surv in all_rows:
        key = str(det.species_id) if det.species_id else (det.raw_label or "Unclassified")
        if key not in grouped:
            grouped[key] = []
        grouped[key].append((det, obs, surv))

    species_population: List[Dict[str, Any]] = []

    for key, items in grouped.items():
        total_count = sum(item[0].count or 1 for item in items)
        
        # Last detected date
        dates = []
        for det, obs, surv in items:
            dt = obs.captured_at or obs.created_at or det.created_at
            if dt:
                dates.append(dt)
        last_detected_dt = max(dates) if dates else None
        last_detected_str = last_detected_dt.isoformat() if last_detected_dt else None

        # Trend calculation: compare last 30 days vs previous 30 days (days 31-60)
        recent_count = 0
        prev_count = 0
        for det, obs, surv in items:
            dt = obs.captured_at or obs.created_at or det.created_at
            if dt:
                if dt >= thirty_days_ago:
                    recent_count += (det.count or 1)
                elif dt >= sixty_days_ago:
                    prev_count += (det.count or 1)

        if recent_count > prev_count:
            trend = "increasing"
        elif recent_count < prev_count:
            trend = "declining"
        else:
            trend = "stable"

        # Resolve species info
        sample_det = items[0][0]
        sp_id = str(sample_det.species_id) if sample_det.species_id else None
        if sp_id:
            sp = db.query(Species).filter(Species.id == sp_id).first()
            sp_name = sp.common_name if sp else "Unknown"
            sci_name = sp.scientific_name if sp else None
            is_endangered = sp.is_endangered if sp else False
            status = (
                (sp.conservation_status.value if hasattr(sp.conservation_status, "value") else str(sp.conservation_status))
                if sp and sp.conservation_status else None
            )
        else:
            sp_name = sample_det.raw_label or "Unclassified"
            sci_name = None
            is_endangered = False
            status = None

        species_population.append(
            {
                "species_id": sp_id,
                "species_name": sp_name,
                "scientific_name": sci_name,
                "is_endangered": is_endangered,
                "conservation_status": status,
                "detection_count": total_count,
                "last_detected": last_detected_str,
                "trend": trend,
                "recent_30d_count": recent_count,
                "prev_30d_count": prev_count,
            }
        )

    # Sort by detection count descending
    species_population.sort(key=lambda x: x["detection_count"], reverse=True)

    return {
        "site_id": site.id,
        "site_name": site.name,
        "total_detections": sum(sp["detection_count"] for sp in species_population),
        "species_population": species_population,
    }


def get_population_density(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Calculates population density per species using detections per survey as a proxy.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {"site_id": site_id, "site_name": None, "total_surveys": 0, "species_density": []}

    total_surveys = db.query(Survey).filter(Survey.site_id == site_id).count()

    pop_summary = get_species_population_by_site(site_id, db)
    species_list = pop_summary.get("species_population", [])

    density_list = []
    for sp in species_list:
        count = sp["detection_count"]
        density_val = round(count / total_surveys, 2) if total_surveys > 0 else 0.0
        density_list.append(
            {
                "species_id": sp["species_id"],
                "species_name": sp["species_name"],
                "scientific_name": sp["scientific_name"],
                "is_endangered": sp["is_endangered"],
                "detection_count": count,
                "density_per_survey": density_val,
            }
        )

    return {
        "site_id": site.id,
        "site_name": site.name,
        "total_surveys": total_surveys,
        "species_density": density_list,
    }


def get_population_trends(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Groups detections by month for the last 6 months to construct time-series data for line chart visualization.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {"site_id": site_id, "site_name": None, "months": [], "species_list": [], "series": []}

    now = datetime.datetime.utcnow()
    # Generate exact calendar month labels [YYYY-MM] for the last 6 months
    month_dates = []
    year = now.year
    month = now.month
    for _ in range(6):
        dt = datetime.datetime(year, month, 1)
        month_dates.append((dt.strftime("%Y-%m"), dt.strftime("%b %Y")))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    month_dates.reverse()

    base_q = (
        db.query(Detection, Observation, Survey)
        .join(Observation, Observation.id == Detection.observation_id)
        .join(Survey, Survey.id == Observation.survey_id)
        .filter(Survey.site_id == site_id)
    )

    all_rows = base_q.all()

    # Map: species_name -> { "YYYY-MM": count }
    species_monthly: Dict[str, Dict[str, int]] = {}

    for det, obs, surv in all_rows:
        dt = obs.captured_at or obs.created_at or det.created_at
        if not dt:
            continue
        ym = dt.strftime("%Y-%m")

        if det.species_id:
            sp = db.query(Species).filter(Species.id == det.species_id).first()
            sp_name = sp.common_name if sp else "Unknown"
        else:
            sp_name = det.raw_label or "Unclassified"

        if sp_name not in species_monthly:
            species_monthly[sp_name] = {ym_key: 0 for ym_key, _ in month_dates}
        
        if ym in species_monthly[sp_name]:
            species_monthly[sp_name][ym] += (det.count or 1)

    species_list = list(species_monthly.keys())

    # Build Recharts series
    series = []
    for ym_key, month_label in month_dates:
        row = {"month": month_label, "raw_month": ym_key}
        for sp_name in species_list:
            row[sp_name] = species_monthly[sp_name].get(ym_key, 0)
        series.append(row)

    return {
        "site_id": site.id,
        "site_name": site.name,
        "months": [m_label for _, m_label in month_dates],
        "species_list": species_list,
        "series": series,
    }
