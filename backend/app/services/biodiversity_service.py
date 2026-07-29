"""
biodiversity_service.py
=======================
Computes biodiversity metrics from Detection records.

The primary metric is the Shannon-Wiener Diversity Index:
    H = -Σ (p_i × ln(p_i))
where p_i is the proportion of detections belonging to species i.

Requires only Detection + Observation rows that already exist in the DB —
fully testable by manually inserting Detection rows even before real inference
works.
"""

import logging
import math
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Detection, MonitoringSite, Observation, Species, Survey

logger = logging.getLogger("wildlife.biodiversity")


# ---------------------------------------------------------------------------
# Core Shannon index computation
# ---------------------------------------------------------------------------

def _shannon_from_counts(species_counts: Dict[str, int]) -> float:
    """
    Compute Shannon-Wiener index from a mapping of {species_id: count}.
    Returns 0.0 for zero or one species (no diversity to measure).
    """
    total = sum(species_counts.values())
    if total == 0:
        return 0.0
    h = 0.0
    for count in species_counts.values():
        if count > 0:
            p_i = count / total
            h -= p_i * math.log(p_i)
    return round(h, 6)


def _build_result(
    species_counts: Dict[str, int],
    db: Session,
) -> Dict[str, Any]:
    """
    Build the full biodiversity result dict from {species_id: count}.
    Resolves species names for the breakdown list.
    """
    total = sum(species_counts.values())
    shannon = _shannon_from_counts(species_counts)
    richness = len(species_counts)

    breakdown: List[Dict[str, Any]] = []
    for species_id, count in sorted(species_counts.items(), key=lambda x: -x[1]):
        if species_id and species_id != "None":
            sp = db.query(Species).filter(Species.id == species_id).first()
            sp_id = species_id
            sp_name = sp.common_name if sp else "Unknown"
            sci_name = sp.scientific_name if sp else None
        else:
            sp_id = None
            sp_name = "Unclassified / Raw Detection"
            sci_name = None

        breakdown.append(
            {
                "species_id": sp_id,
                "species_name": sp_name,
                "scientific_name": sci_name,
                "count": count,
            }
        )

    return {
        "shannon_index": shannon,
        "species_richness": richness,
        "total_detections": total,
        "species_breakdown": breakdown,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_shannon_index(survey_id: str, db: Session) -> Dict[str, Any]:
    """
    Compute biodiversity metrics for all Detections under a given Survey.

    Returns:
        {
            shannon_index: float,
            species_richness: int,
            total_detections: int,
            species_breakdown: [{species_id, species_name, scientific_name, count}]
        }
    """
    # Verify survey exists
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey is None:
        return {
            "shannon_index": 0.0,
            "species_richness": 0,
            "total_detections": 0,
            "species_breakdown": [],
        }

    # Aggregate detections grouped by species for this survey's observations
    rows = (
        db.query(Detection.species_id, func.coalesce(func.sum(Detection.count), func.count(Detection.id)).label("cnt"))
        .join(Observation, Observation.id == Detection.observation_id)
        .filter(Observation.survey_id == survey_id)
        .group_by(Detection.species_id)
        .all()
    )

    species_counts: Dict[str, int] = {str(row.species_id): int(row.cnt) for row in rows}
    result = _build_result(species_counts, db)
    logger.info(
        "Biodiversity for survey %s: H=%.4f, richness=%d, total=%d",
        survey_id,
        result["shannon_index"],
        result["species_richness"],
        result["total_detections"],
    )
    return result


def compute_site_biodiversity(site_id: str, db: Session) -> Dict[str, Any]:
    """
    Aggregate biodiversity across ALL surveys at a given MonitoringSite.

    Returns the same shape as compute_shannon_index.
    """
    site = db.query(MonitoringSite).filter(MonitoringSite.id == site_id).first()
    if site is None:
        return {
            "shannon_index": 0.0,
            "species_richness": 0,
            "total_detections": 0,
            "species_breakdown": [],
        }

    rows = (
        db.query(Detection.species_id, func.coalesce(func.sum(Detection.count), func.count(Detection.id)).label("cnt"))
        .join(Observation, Observation.id == Detection.observation_id)
        .join(Survey, Survey.id == Observation.survey_id)
        .filter(Survey.site_id == site_id)
        .group_by(Detection.species_id)
        .all()
    )

    species_counts: Dict[str, int] = {str(row.species_id): int(row.cnt) for row in rows}
    result = _build_result(species_counts, db)
    logger.info(
        "Biodiversity for site %s: H=%.4f, richness=%d, total=%d",
        site_id,
        result["shannon_index"],
        result["species_richness"],
        result["total_detections"],
    )
    return result
