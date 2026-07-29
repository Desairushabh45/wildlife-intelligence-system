"""
health_service.py
=================
Service logic for Wildlife Health Scoring Engine:
Calculates composite ecosystem health score using the exact formula from project spec:
Score = (species_diversity_score * 0.30) +
        (population_stability_score * 0.25) +
        (habitat_quality_score * 0.20) +
        (endangered_species_score * 0.15) +
        (environmental_conditions_score * 0.10)
"""

from typing import Any, Dict
from sqlalchemy.orm import Session

from app.models.models import MonitoringSite
from app.services import biodiversity_service, habitat_service, population_service


def get_conservation_status(health_score: float) -> Dict[str, str]:
    """Map health score to Conservation Status classification."""
    score = max(0.0, min(100.0, float(health_score)))
    if score >= 80.0:
        return {"status": "Excellent", "color": "emerald", "badge_class": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"}
    elif score >= 60.0:
        return {"status": "Healthy", "color": "green", "badge_class": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"}
    elif score >= 40.0:
        return {"status": "Moderate Concern", "color": "yellow", "badge_class": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"}
    elif score >= 20.0:
        return {"status": "Vulnerable", "color": "orange", "badge_class": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300"}
    else:
        return {"status": "Critical", "color": "red", "badge_class": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"}


def compute_ecosystem_health_score(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Computes overall ecosystem health score for a site based on:
    1. species_diversity_score (30%): normalized Shannon index (0-100)
    2. population_stability_score (25%): stable=80, increasing=100, declining=20
    3. habitat_quality_score (20%): habitat score from habitat_service
    4. endangered_species_score (15%): 100 if endangered & stable/increasing, 50 if declining, 0 if none
    5. environmental_conditions_score (10%): default 70.0 (placeholder for M4)
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {
            "site_id": site_id,
            "site_name": None,
            "health_score": 0.0,
            "conservation_status": "Critical",
            "color": "red",
            "components": {},
        }

    # 1. Diversity Score (30%)
    bio_data = biodiversity_service.compute_site_biodiversity(site_id, db)
    shannon_index = bio_data.get("shannon_index", 0.0)
    species_diversity_score = min(100.0, round((shannon_index / 2.5) * 100.0, 1))

    # 2. Population Stability Score (25%)
    pop_data = population_service.get_species_population_by_site(site_id, db)
    species_list = pop_data.get("species_population", [])

    trends = [sp.get("trend") for sp in species_list if sp.get("trend")]
    if not trends:
        population_stability_score = 80.0  # default stable if no data
    elif "declining" in trends:
        population_stability_score = 20.0
    elif "increasing" in trends:
        population_stability_score = 100.0
    else:
        population_stability_score = 80.0

    # 3. Habitat Quality Score (20%)
    hab_data = habitat_service.compute_habitat_score(site_id, db)
    habitat_quality_score = hab_data.get("habitat_score", 0.0)

    # 4. Endangered Species Score (15%)
    endangered_items = [sp for sp in species_list if sp.get("is_endangered")]
    if not endangered_items:
        endangered_species_score = 0.0
    else:
        has_declining = any(sp.get("trend") == "declining" for sp in endangered_items)
        if has_declining:
            endangered_species_score = 50.0
        else:
            endangered_species_score = 100.0

    # 5. Environmental Conditions Score (10% - placeholder for M4)
    environmental_conditions_score = 70.0

    # Composite Health Score
    health_score = round(
        (species_diversity_score * 0.30)
        + (population_stability_score * 0.25)
        + (habitat_quality_score * 0.20)
        + (endangered_species_score * 0.15)
        + (environmental_conditions_score * 0.10),
        1,
    )
    health_score = max(0.0, min(100.0, health_score))

    status_info = get_conservation_status(health_score)

    return {
        "site_id": site.id,
        "site_name": site.name,
        "health_score": health_score,
        "conservation_status": status_info["status"],
        "color": status_info["color"],
        "badge_class": status_info["badge_class"],
        "components": {
            "species_diversity": {
                "weight_percent": 30,
                "score": species_diversity_score,
                "shannon_index": shannon_index,
            },
            "population_stability": {
                "weight_percent": 25,
                "score": population_stability_score,
                "primary_trend": "increasing" if population_stability_score == 100.0 else ("declining" if population_stability_score == 20.0 else "stable"),
            },
            "habitat_quality": {
                "weight_percent": 20,
                "score": habitat_quality_score,
                "grade": hab_data.get("grade"),
            },
            "endangered_species": {
                "weight_percent": 15,
                "score": endangered_species_score,
                "endangered_count": len(endangered_items),
            },
            "environmental_conditions": {
                "weight_percent": 10,
                "score": environmental_conditions_score,
                "is_placeholder": True,
                "note": "Default 70.0 placeholder for M4 environmental sensor integration",
            },
        },
    }
