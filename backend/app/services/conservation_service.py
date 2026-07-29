"""
conservation_service.py
========================
Service logic for Conservation Recommendation Engine:
- Rule-based recommendation generator evaluating site habitat scores, endangered species trends, biodiversity richness, and activity.
"""

import datetime
import uuid
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.models.models import MonitoringSite
from app.services import biodiversity_service, habitat_service, population_service

PRIORITY_ORDER = {"critical": 1, "urgent": 2, "high": 3, "medium": 4, "low": 5}


def generate_recommendations(site_id: str, db: Session) -> List[Dict[str, Any]]:
    """
    Generate rule-based conservation recommendations for a monitoring site based on:
    - Habitat score (<40, >70)
    - Endangered species detection and trend (declining vs present)
    - Species richness (>5)
    - Recent 30-day activity (no detections)
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return []

    habitat_data = habitat_service.compute_habitat_score(site_id, db)
    habitat_score = habitat_data.get("habitat_score", 0.0)

    bio_data = biodiversity_service.compute_site_biodiversity(site_id, db)
    species_richness = bio_data.get("species_richness", 0)

    pop_data = population_service.get_species_population_by_site(site_id, db)
    species_list = pop_data.get("species_population", [])

    now = datetime.datetime.utcnow()
    thirty_days_ago = now - datetime.timedelta(days=30)

    recommendations: List[Dict[str, Any]] = []

    def _add_rec(priority: str, msg: str):
        recommendations.append(
            {
                "id": str(uuid.uuid4()),
                "site_id": site.id,
                "site_name": site.name,
                "priority": priority,
                "message": msg,
                "created_at": now.isoformat(),
            }
        )

    # Rule 1: Low habitat score (< 40)
    if habitat_score < 40.0:
        _add_rec("critical", f"CRITICAL: Immediate conservation intervention required at {site.name}")

    # Track activity & endangered species conditions
    recent_activity_found = False
    endangered_declining_species = []
    endangered_species = []

    for sp in species_list:
        if sp.get("recent_30d_count", 0) > 0:
            recent_activity_found = True
        
        # Check last detected timestamp
        ld_str = sp.get("last_detected")
        if ld_str:
            try:
                ld_dt = datetime.datetime.fromisoformat(ld_str)
                if ld_dt >= thirty_days_ago:
                    recent_activity_found = True
            except Exception:
                pass

        if sp.get("is_endangered"):
            endangered_species.append(sp["species_name"])
            if sp.get("trend") == "declining":
                endangered_declining_species.append(sp["species_name"])

    # Rule 2: Endangered species with declining trend
    for sp_name in endangered_declining_species:
        _add_rec("urgent", f"URGENT: {sp_name} population declining at {site.name} — increase patrol frequency")

    # Rule 3: Endangered species detected
    for sp_name in endangered_species:
        _add_rec("high", f"PRIORITY: Endangered species {sp_name} confirmed at {site.name} — recommend protected zone")

    # Rule 4: High biodiversity (species_richness > 5)
    if species_richness > 5:
        _add_rec("medium", f"POSITIVE: High biodiversity detected at {site.name} — recommend conservation priority status")

    # Rule 5: No detections in last 30 days
    if not recent_activity_found:
        _add_rec("high", f"ALERT: No wildlife activity detected at {site.name} in 30 days — check equipment")

    # Rule 6: Healthy ecosystem (habitat_score > 70)
    if habitat_score > 70.0:
        _add_rec("low", f"MAINTAIN: {site.name} shows healthy ecosystem — continue current monitoring schedule")

    # Sort recommendations by priority
    recommendations.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 99))

    return recommendations


def get_all_recommendations(db: Session) -> List[Dict[str, Any]]:
    """Get all recommendations across all monitoring sites, sorted by priority."""
    sites = db.query(MonitoringSite).all()
    all_recs: List[Dict[str, Any]] = []

    for site in sites:
        recs = generate_recommendations(site.id, db)
        all_recs.extend(recs)

    all_recs.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 99))
    return all_recs
