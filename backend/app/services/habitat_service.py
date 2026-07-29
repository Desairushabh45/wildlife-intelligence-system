"""
habitat_service.py
==================
Service logic for Habitat Intelligence Engine:
- Weighted habitat score calculation (diversity, endangered presence, frequency, richness, survey coverage)
- Grade (A/B/C/D/F) and status classification (Excellent, Healthy, Moderate Concern, Vulnerable, Critical)
- Site rankings across all monitoring sites
"""

from typing import Any, Dict, List
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Detection, MonitoringSite, Observation, Species, Survey
from app.services import biodiversity_service


def get_habitat_classification(habitat_score: float) -> Dict[str, str]:
    """Classify score into Grade (A/B/C/D/F), Status, and UI Badge color theme."""
    score = max(0.0, min(100.0, float(habitat_score)))
    if score >= 80.0:
        return {"grade": "A", "classification": "Excellent", "color": "emerald", "bg_class": "bg-emerald-50 text-emerald-700 border-emerald-200"}
    elif score >= 60.0:
        return {"grade": "B", "classification": "Healthy", "color": "green", "bg_class": "bg-green-50 text-green-700 border-green-200"}
    elif score >= 40.0:
        return {"grade": "C", "classification": "Moderate Concern", "color": "yellow", "bg_class": "bg-yellow-50 text-yellow-700 border-yellow-200"}
    elif score >= 20.0:
        return {"grade": "D", "classification": "Vulnerable", "color": "orange", "bg_class": "bg-orange-50 text-orange-700 border-orange-200"}
    else:
        return {"grade": "F", "classification": "Critical", "color": "red", "bg_class": "bg-red-50 text-red-700 border-red-200"}


def compute_habitat_score(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Computes habitat score using the 5-component weighted formula:
    - Species diversity score (30%)
    - Endangered species presence (25%)
    - Detection frequency (20%)
    - Species richness (15%)
    - Survey coverage (10%)
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if not site:
        return {
            "site_id": site_id,
            "site_name": None,
            "habitat_score": 0.0,
            "grade": "F",
            "classification": "Critical",
            "color": "red",
            "breakdown": {},
        }

    # 1. Diversity and species metrics from biodiversity service
    bio_data = biodiversity_service.compute_site_biodiversity(site_id, db)
    shannon_index = bio_data.get("shannon_index", 0.0)
    species_richness = bio_data.get("species_richness", 0)
    total_detections = bio_data.get("total_detections", 0)
    breakdown_list = bio_data.get("species_breakdown", [])

    total_surveys = db.query(Survey).filter(Survey.site_id == site_id).count()

    # Calculate endangered species detection count
    endangered_detections = 0
    for item in breakdown_list:
        sp_id = item.get("species_id")
        if sp_id:
            sp = db.query(Species).filter(Species.id == sp_id).first()
            if sp and sp.is_endangered:
                endangered_detections += item.get("count", 0)

    # Normalize components (0 - 100)
    # Diversity (30%): Shannon index normalized (assuming max ~2.5 for local ecosystems)
    diversity_score = min(100.0, round((shannon_index / 2.5) * 100.0, 1))

    # Endangered presence (25%): % of total detections that are endangered
    if total_detections > 0:
        endangered_score = min(100.0, round((endangered_detections / total_detections) * 100.0, 1))
    else:
        endangered_score = 0.0

    # Detection frequency (20%): detections per survey proxy
    surveys_count = max(1, total_surveys)
    detections_per_survey = total_detections / surveys_count
    frequency_score = min(100.0, round(detections_per_survey * 10.0, 1))

    # Species richness (15%): count of distinct species
    richness_score = min(100.0, round(species_richness * 15.0, 1))

    # Survey coverage (10%): number of surveys conducted
    coverage_score = min(100.0, round(total_surveys * 20.0, 1))

    # Weighted final score
    weighted_score = (
        (diversity_score * 0.30)
        + (endangered_score * 0.25)
        + (frequency_score * 0.20)
        + (richness_score * 0.15)
        + (coverage_score * 0.10)
    )
    habitat_score = round(max(0.0, min(100.0, weighted_score)), 1)

    class_info = get_habitat_classification(habitat_score)

    return {
        "site_id": site.id,
        "site_name": site.name,
        "habitat_score": habitat_score,
        "grade": class_info["grade"],
        "classification": class_info["classification"],
        "color": class_info["color"],
        "bg_class": class_info["bg_class"],
        "breakdown": {
            "species_diversity": {
                "weight_percent": 30,
                "score": diversity_score,
                "raw_shannon_index": shannon_index,
            },
            "endangered_presence": {
                "weight_percent": 25,
                "score": endangered_score,
                "endangered_detections": endangered_detections,
                "total_detections": total_detections,
            },
            "detection_frequency": {
                "weight_percent": 20,
                "score": frequency_score,
                "detections_per_survey": round(detections_per_survey, 2),
            },
            "species_richness": {
                "weight_percent": 15,
                "score": richness_score,
                "count": species_richness,
            },
            "survey_coverage": {
                "weight_percent": 10,
                "score": coverage_score,
                "total_surveys": total_surveys,
            },
        },
    }


def get_site_rankings(db: Session) -> List[Dict[str, Any]]:
    """Rank all monitoring sites by habitat score descending."""
    sites = db.query(MonitoringSite).all()
    rankings = []

    for site in sites:
        score_data = compute_habitat_score(site.id, db)
        rankings.append(
            {
                "site_id": site.id,
                "site_name": site.name,
                "habitat_type": site.habitat_type,
                "protected_area": site.protected_area,
                "habitat_score": score_data["habitat_score"],
                "grade": score_data["grade"],
                "classification": score_data["classification"],
                "color": score_data["color"],
                "bg_class": score_data["bg_class"],
            }
        )

    rankings.sort(key=lambda x: x["habitat_score"], reverse=True)
    for idx, item in enumerate(rankings, 1):
        item["rank"] = idx

    return rankings
