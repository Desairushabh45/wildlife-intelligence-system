"""
seed_data.py – Populate wildlife_db with realistic sample data for Milestone 1-3 demo.

Run from the backend/ directory:
    python seed_data.py
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')
import uuid
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

# ── Bootstrap ────────────────────────────────────────────────────────────────
# Ensure the app package is importable when running from backend/.
sys.path.insert(0, ".")

from app.core.database import Base, SessionLocal, engine
from app.models.models import (
    User, UserRole,
    Species, ConservationStatus,
    MonitoringSite, DeviceType,
    Survey, Observation, ObservationType, Detection,
)


def gen_uuid():
    return str(uuid.uuid4())


# ── Additional Models for Comprehensive Demo Analytics ───────────────────────

class PopulationEstimate(Base):
    __tablename__ = "population_estimates"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    site_id = Column(UUID(as_uuid=False), ForeignKey("monitoring_sites.id"), nullable=False)
    species_id = Column(UUID(as_uuid=False), ForeignKey("species.id"), nullable=False)
    estimated_count = Column(Integer, nullable=False)
    density_per_sqkm = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("MonitoringSite")
    species = relationship("Species")


class HabitatScore(Base):
    __tablename__ = "habitat_scores"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    site_id = Column(UUID(as_uuid=False), ForeignKey("monitoring_sites.id"), nullable=False)
    overall_score = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("MonitoringSite")


# ── Password hashing (same scheme used by the app) ──────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
DEFAULT_PASSWORD = pwd_ctx.hash("wildlife123")

# ── Seed data definitions ───────────────────────────────────────────────────

USERS = [
    {
        "full_name": "Dr. Priya Sharma",
        "email": "priya@wildlife.com",
        "hashed_password": DEFAULT_PASSWORD,
        "role": UserRole.WILDLIFE_RESEARCHER,
    },
    {
        "full_name": "Rajan Mehta",
        "email": "rajan@wildlife.com",
        "hashed_password": DEFAULT_PASSWORD,
        "role": UserRole.CONSERVATION_OFFICER,
    },
    {
        "full_name": "Suresh Kumar",
        "email": "suresh@wildlife.com",
        "hashed_password": DEFAULT_PASSWORD,
        "role": UserRole.FOREST_DEPARTMENT_OFFICER,
    },
    {
        "full_name": "Admin User",
        "email": "admin@wildlife.com",
        "hashed_password": DEFAULT_PASSWORD,
        "role": UserRole.ADMINISTRATOR,
    },
    {
        "full_name": "Rushabh Desai",
        "email": "rushabhdesai78@gmail.com",
        "hashed_password": DEFAULT_PASSWORD,
        "role": UserRole.ADMINISTRATOR,
    },
]

SPECIES_LIST = [
    # ── Original Species ─────────────────────────────────────────────────────
    {
        "common_name": "Asiatic Lion",
        "scientific_name": "Panthera leo persica",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.CRITICALLY_ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Bengal Tiger",
        "scientific_name": "Panthera tigris tigris",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Indian Elephant",
        "scientific_name": "Elephas maximus indicus",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Indian Peafowl",
        "scientific_name": "Pavo cristatus",
        "taxonomic_class": "bird",
        "conservation_status": ConservationStatus.LEAST_CONCERN,
        "is_endangered": False,
    },
    {
        "common_name": "King Cobra",
        "scientific_name": "Ophiophagus hannah",
        "taxonomic_class": "reptile",
        "conservation_status": ConservationStatus.VULNERABLE,
        "is_endangered": False,
    },
    {
        "common_name": "Sloth Bear",
        "scientific_name": "Melursus ursinus",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.VULNERABLE,
        "is_endangered": True,
    },
    {
        "common_name": "Asiatic Cheetah (Cheetha)",
        "scientific_name": "Acinonyx jubatus venaticus",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.CRITICALLY_ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Indian Fox",
        "scientific_name": "Vulpes bengalensis",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.LEAST_CONCERN,
        "is_endangered": False,
    },
    {
        "common_name": "House Crow",
        "scientific_name": "Corvus splendens",
        "taxonomic_class": "bird",
        "conservation_status": ConservationStatus.LEAST_CONCERN,
        "is_endangered": False,
    },

    # ── New Species (Comprehensive Demo Set) ─────────────────────────────────
    {
        "common_name": "Gharial",
        "scientific_name": "Gavialis gangeticus",
        "taxonomic_class": "reptile",
        "conservation_status": ConservationStatus.CRITICALLY_ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Snow Leopard",
        "scientific_name": "Panthera uncia",
        "taxonomic_class": "mammal",
        "conservation_status": ConservationStatus.VULNERABLE,
        "is_endangered": True,
    },
    {
        "common_name": "Indian Vulture",
        "scientific_name": "Gyps indicus",
        "taxonomic_class": "bird",
        "conservation_status": ConservationStatus.CRITICALLY_ENDANGERED,
        "is_endangered": True,
    },
    {
        "common_name": "Olive Ridley Turtle",
        "scientific_name": "Lepidochelys olivacea",
        "taxonomic_class": "reptile",
        "conservation_status": ConservationStatus.VULNERABLE,
        "is_endangered": True,
    },
    {
        "common_name": "Great Indian Bustard",
        "scientific_name": "Ardeotis nigriceps",
        "taxonomic_class": "bird",
        "conservation_status": ConservationStatus.CRITICALLY_ENDANGERED,
        "is_endangered": True,
    },
]

SITES = [
    # ── Original Sites ───────────────────────────────────────────────────────
    {
        "name": "Gir Forest Camera Trap 1",
        "habitat_type": "dry deciduous forest",
        "protected_area": "Gir National Park",
        "device_type": DeviceType.CAMERA_TRAP,
        "latitude": 21.1231,
        "longitude": 70.7978,
    },
    {
        "name": "Bandipur Audio Sensor 1",
        "habitat_type": "tropical dry forest",
        "protected_area": "Bandipur National Park",
        "device_type": DeviceType.AUDIO_SENSOR,
        "latitude": 11.6543,
        "longitude": 76.6342,
    },
    {
        "name": "Kaziranga Drone Zone",
        "habitat_type": "grassland",
        "protected_area": "Kaziranga National Park",
        "device_type": DeviceType.DRONE,
        "latitude": 26.5775,
        "longitude": 93.1711,
    },

    # ── New Monitoring Sites ─────────────────────────────────────────────────
    {
        "name": "Ranthambore Tiger Reserve",
        "habitat_type": "dry deciduous forest",
        "protected_area": "Ranthambore National Park",
        "device_type": DeviceType.CAMERA_TRAP,
        "latitude": 26.0173,
        "longitude": 76.5026,
    },
    {
        "name": "Sundarbans Mangrove Zone",
        "habitat_type": "mangrove forest",
        "protected_area": "Sundarbans National Park",
        "device_type": DeviceType.DRONE,
        "latitude": 21.9497,
        "longitude": 88.9104,
    },
    {
        "name": "Jim Corbett Camera Zone",
        "habitat_type": "subtropical grassland",
        "protected_area": "Jim Corbett National Park",
        "device_type": DeviceType.CAMERA_TRAP,
        "latitude": 29.5300,
        "longitude": 78.7747,
    },
    {
        "name": "Periyar Audio Station",
        "habitat_type": "tropical rainforest",
        "protected_area": "Periyar Tiger Reserve",
        "device_type": DeviceType.AUDIO_SENSOR,
        "latitude": 9.4616,
        "longitude": 77.1645,
    },
]

SURVEYS_DATA = [
    {
        "site_name": "Gir Forest Camera Trap 1",
        "start_date": datetime(2026, 7, 1),
        "notes": "Morning wildlife census - lion pride spotted",
    },
    {
        "site_name": "Bandipur Audio Sensor 1",
        "start_date": datetime(2026, 7, 5),
        "notes": "Bioacoustic monitoring session - elephant calls recorded",
    },
    {
        "site_name": "Kaziranga Drone Zone",
        "start_date": datetime(2026, 7, 10),
        "notes": "Aerial grassland herbivore survey - rhino and elephant tracking",
    },
    {
        "site_name": "Ranthambore Tiger Reserve",
        "start_date": datetime(2026, 7, 12),
        "notes": "Tiger pugmark trail survey - 3 tigers spotted near waterhole",
    },
    {
        "site_name": "Sundarbans Mangrove Zone",
        "start_date": datetime(2026, 7, 15),
        "notes": "Aerial mangrove health assessment - drone imagery captured",
    },
    {
        "site_name": "Jim Corbett Camera Zone",
        "start_date": datetime(2026, 7, 18),
        "notes": "Elephant herd movement tracking - herd of 12 spotted",
    },
    {
        "site_name": "Periyar Audio Station",
        "start_date": datetime(2026, 7, 22),
        "notes": "Bioacoustic monitoring - lion-tailed macaque calls recorded",
    },
]

# ── Detailed Detections per Survey ──────────────────────────────────────────
# Each survey has 2-3 realistic detections with confidence (0.70-0.95), count (1-5), and behavior tag.
SURVEY_DETECTIONS_MAP = {
    "Gir Forest Camera Trap 1": [
        {"species": "Asiatic Lion", "confidence": 0.92, "count": 3, "behavior": "resting"},
        {"species": "Indian Peafowl", "confidence": 0.88, "count": 2, "behavior": "feeding"},
        {"species": "Indian Fox", "confidence": 0.78, "count": 1, "behavior": "moving"},
    ],
    "Bandipur Audio Sensor 1": [
        {"species": "Indian Elephant", "confidence": 0.94, "count": 4, "behavior": "moving"},
        {"species": "Sloth Bear", "confidence": 0.82, "count": 1, "behavior": "feeding"},
        {"species": "Indian Peafowl", "confidence": 0.85, "count": 2, "behavior": "resting"},
    ],
    "Kaziranga Drone Zone": [
        {"species": "Indian Elephant", "confidence": 0.91, "count": 5, "behavior": "drinking"},
        {"species": "Great Indian Bustard", "confidence": 0.76, "count": 2, "behavior": "feeding"},
        {"species": "King Cobra", "confidence": 0.72, "count": 1, "behavior": "moving"},
    ],
    "Ranthambore Tiger Reserve": [
        {"species": "Bengal Tiger", "confidence": 0.95, "count": 3, "behavior": "drinking"},
        {"species": "Sloth Bear", "confidence": 0.84, "count": 1, "behavior": "resting"},
        {"species": "Indian Peafowl", "confidence": 0.89, "count": 4, "behavior": "feeding"},
    ],
    "Sundarbans Mangrove Zone": [
        {"species": "Bengal Tiger", "confidence": 0.89, "count": 1, "behavior": "moving"},
        {"species": "Olive Ridley Turtle", "confidence": 0.83, "count": 3, "behavior": "moving"},
        {"species": "Gharial", "confidence": 0.79, "count": 2, "behavior": "resting"},
    ],
    "Jim Corbett Camera Zone": [
        {"species": "Indian Elephant", "confidence": 0.93, "count": 5, "behavior": "moving"},
        {"species": "Bengal Tiger", "confidence": 0.88, "count": 1, "behavior": "resting"},
        {"species": "Indian Vulture", "confidence": 0.81, "count": 4, "behavior": "feeding"},
    ],
    "Periyar Audio Station": [
        {"species": "Indian Elephant", "confidence": 0.90, "count": 2, "behavior": "drinking"},
        {"species": "Sloth Bear", "confidence": 0.77, "count": 1, "behavior": "moving"},
        {"species": "Indian Peafowl", "confidence": 0.86, "count": 3, "behavior": "resting"},
    ],
}

# ── Population Estimates ────────────────────────────────────────────────────
POPULATION_ESTIMATES_DATA = [
    {
        "site_name": "Ranthambore Tiger Reserve",
        "species_name": "Bengal Tiger",
        "estimated_count": 45,
        "density_per_sqkm": 0.8,
        "notes": "Annual camera-trap mark-recapture population census.",
    },
    {
        "site_name": "Jim Corbett Camera Zone",
        "species_name": "Indian Elephant",
        "estimated_count": 600,
        "density_per_sqkm": 2.1,
        "notes": "Corridor tracking survey along Ramganga river basin.",
    },
    {
        "site_name": "Gir Forest Camera Trap 1",
        "species_name": "Asiatic Lion",
        "estimated_count": 674,
        "density_per_sqkm": 3.2,
        "notes": "State forest department Asiatic lion census estimate.",
    },
    {
        "site_name": "Sundarbans Mangrove Zone",
        "species_name": "Bengal Tiger",
        "estimated_count": 100,
        "density_per_sqkm": 0.6,
        "notes": "Tidal delta pugmark and camera trap estimate.",
    },
    {
        "site_name": "Bandipur Audio Sensor 1",
        "species_name": "Indian Elephant",
        "estimated_count": 450,
        "density_per_sqkm": 1.8,
        "notes": "Nilgiri biosphere acoustic density calculation.",
    },
]

# ── Habitat Scores ──────────────────────────────────────────────────────────
HABITAT_SCORES_DATA = [
    {
        "site_name": "Gir Forest Camera Trap 1",
        "overall_score": 78.0,
        "status": "Healthy",
        "notes": "High apex predator density with intact deciduous vegetation cover.",
    },
    {
        "site_name": "Bandipur Audio Sensor 1",
        "overall_score": 85.0,
        "status": "Excellent",
        "notes": "Thriving multi-trophic biodiversity with continuous elephant corridors.",
    },
    {
        "site_name": "Kaziranga Drone Zone",
        "overall_score": 72.0,
        "status": "Healthy",
        "notes": "Rich alluvial grassland with seasonal monsoon inundation pressure.",
    },
    {
        "site_name": "Ranthambore Tiger Reserve",
        "overall_score": 69.0,
        "status": "Moderate Concern",
        "notes": "Buffer zone tourist vehicle pressure and seasonal waterhole shortages.",
    },
    {
        "site_name": "Sundarbans Mangrove Zone",
        "overall_score": 61.0,
        "status": "Vulnerable",
        "notes": "Elevated water salinity, tidal erosion, and cyclone vulnerability.",
    },
    {
        "site_name": "Jim Corbett Camera Zone",
        "overall_score": 82.0,
        "status": "Excellent",
        "notes": "Robust sub-Himalayan forest canopy and perennial river corridors.",
    },
    {
        "site_name": "Periyar Audio Station",
        "overall_score": 76.0,
        "status": "Healthy",
        "notes": "Evergreen rainforest canopy with high bioacoustic richness.",
    },
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def seed_users(db):
    """Insert users if they don't already exist (matched by email)."""
    for data in USERS:
        exists = db.query(User).filter(User.email == data["email"]).first()
        if exists:
            print(f"  ⏭  User '{data['full_name']}' already exists – skipped.")
            continue
        user = User(**data)
        db.add(user)
        db.flush()
        print(f"  ✅ User '{data['full_name']}' ({data['role'].value}) inserted.")


def seed_species(db):
    """Insert species if they don't already exist (matched by scientific_name)."""
    for data in SPECIES_LIST:
        exists = (
            db.query(Species)
            .filter(Species.scientific_name == data["scientific_name"])
            .first()
        )
        if exists:
            print(f"  ⏭  Species '{data['common_name']}' already exists – skipped.")
            continue
        species = Species(**data)
        db.add(species)
        db.flush()
        print(f"  ✅ Species '{data['common_name']}' ({data['conservation_status'].value}) inserted.")


def seed_monitoring_sites(db, creator_email="priya@wildlife.com"):
    """Insert monitoring sites, linking them to the given user as creator."""
    creator = db.query(User).filter(User.email == creator_email).first()
    if not creator:
        creator = db.query(User).first()
    if not creator:
        print(f"  ❌ Creator user '{creator_email}' not found – cannot seed sites.")
        return

    for data in SITES:
        exists = (
            db.query(MonitoringSite)
            .filter(MonitoringSite.name == data["name"])
            .first()
        )
        if exists:
            print(f"  ⏭  Site '{data['name']}' already exists – skipped.")
            continue

        site = MonitoringSite(
            name=data["name"],
            habitat_type=data["habitat_type"],
            protected_area=data["protected_area"],
            device_type=data["device_type"],
            latitude=data["latitude"],
            longitude=data["longitude"],
            created_by=creator.id,
        )
        db.add(site)
        db.flush()
        print(f"  ✅ Site '{data['name']}' in {data['protected_area']} inserted.")


def seed_surveys(db, creator_email="priya@wildlife.com"):
    """Insert surveys linked to their monitoring sites and the given user."""
    creator = db.query(User).filter(User.email == creator_email).first()
    if not creator:
        creator = db.query(User).first()
    if not creator:
        print(f"  ❌ Creator user '{creator_email}' not found – cannot seed surveys.")
        return

    for data in SURVEYS_DATA:
        site = (
            db.query(MonitoringSite)
            .filter(MonitoringSite.name == data["site_name"])
            .first()
        )
        if not site:
            print(f"  ❌ Site '{data['site_name']}' not found – cannot create survey.")
            continue

        # Duplicate check: same site + same start_date
        exists = (
            db.query(Survey)
            .filter(Survey.site_id == site.id, Survey.start_date == data["start_date"])
            .first()
        )
        if exists:
            print(f"  ⏭  Survey at '{data['site_name']}' on {data['start_date'].date()} already exists – skipped.")
            continue

        survey = Survey(
            site_id=site.id,
            created_by=creator.id,
            start_date=data["start_date"],
            end_date=data["start_date"] + timedelta(days=2),
            notes=data["notes"],
        )
        db.add(survey)
        db.flush()
        print(f"  ✅ Survey at '{data['site_name']}' on {data['start_date'].date()} inserted.")


def seed_observations_and_detections(db, creator_email="priya@wildlife.com"):
    """
    For each survey, create an Observation and attach 2-3 realistic Detection records
    linking to Species, with confidence (0.70-0.95), count (1-5), and behavior tags.
    """
    creator = db.query(User).filter(User.email == creator_email).first()
    if not creator:
        creator = db.query(User).first()
    if not creator:
        print("  ❌ Creator user not found – cannot seed observations.")
        return

    # Cache species lookup by common_name
    all_species = {s.common_name.lower(): s for s in db.query(Species).all()}

    total_detections_added = 0
    for survey_info in SURVEYS_DATA:
        site_name = survey_info["site_name"]
        site = db.query(MonitoringSite).filter(MonitoringSite.name == site_name).first()
        if not site:
            continue

        survey = (
            db.query(Survey)
            .filter(Survey.site_id == site.id, Survey.start_date == survey_info["start_date"])
            .first()
        )
        if not survey:
            continue

        # Check if an observation already exists for this survey
        obs_file_slug = site_name.lower().replace(" ", "_")
        ext = "wav" if site.device_type == DeviceType.AUDIO_SENSOR else "jpg"
        file_path = f"/uploads/{obs_file_slug}_{survey.start_date.strftime('%Y%m%d')}.{ext}"

        obs = db.query(Observation).filter(Observation.survey_id == survey.id).first()
        if not obs:
            obs_type = (
                ObservationType.AUDIO
                if site.device_type == DeviceType.AUDIO_SENSOR
                else ObservationType.IMAGE
            )
            obs = Observation(
                survey_id=survey.id,
                observation_type=obs_type,
                file_path=file_path,
                uploaded_by=creator.id,
                captured_at=survey.start_date + timedelta(hours=4),
                notes=f"Auto capture at {site_name} – {survey_info['notes']}",
            )
            db.add(obs)
            db.flush()
            print(f"  ✅ Observation created for '{site_name}' ({obs_type.value}).")
        else:
            print(f"  ⏭  Observation for '{site_name}' already exists – skipped.")

        # Seed detection records for this observation if none exist yet
        existing_dets_count = db.query(Detection).filter(Detection.observation_id == obs.id).count()
        if existing_dets_count > 0:
            print(f"  ⏭  {existing_dets_count} detections already exist for observation '{obs.id}' – skipped.")
            continue

        detections_def = SURVEY_DETECTIONS_MAP.get(site_name, [])
        for det_info in detections_def:
            sp = all_species.get(det_info["species"].lower())
            if not sp:
                print(f"  ⚠️ Species '{det_info['species']}' not found in database – skipping detection.")
                continue

            source = "yamnet" if site.device_type == DeviceType.AUDIO_SENSOR else "yolo"
            behavior = det_info["behavior"]
            raw_label_text = f"{sp.common_name} (behavior: {behavior})"

            det_kwargs = {
                "observation_id": obs.id,
                "species_id": sp.id,
                "confidence": float(det_info["confidence"]),
                "count": int(det_info["count"]),
                "raw_label": raw_label_text,
                "detection_source": source,
                "created_at": obs.captured_at or survey.start_date,
            }

            if site.device_type != DeviceType.AUDIO_SENSOR:
                det_kwargs["bbox_x1"] = 0.15
                det_kwargs["bbox_y1"] = 0.20
                det_kwargs["bbox_x2"] = 0.65
                det_kwargs["bbox_y2"] = 0.75

            # If Detection model has behavior_tag column support
            if hasattr(Detection, "behavior_tag"):
                det_kwargs["behavior_tag"] = behavior

            detection = Detection(**det_kwargs)
            db.add(detection)
            total_detections_added += 1

        db.flush()
        print(f"  ✅ Seeded {len(detections_def)} detections for '{site_name}'.")

    print(f"  📊 Total new detection records added: {total_detections_added}")


def seed_population_estimates(db):
    """Insert population estimates for key sites and species."""
    for item in POPULATION_ESTIMATES_DATA:
        site = db.query(MonitoringSite).filter(MonitoringSite.name == item["site_name"]).first()
        if not site:
            print(f"  ⚠️ Site '{item['site_name']}' not found – skipping population estimate.")
            continue

        species = db.query(Species).filter(Species.common_name == item["species_name"]).first()
        if not species:
            print(f"  ⚠️ Species '{item['species_name']}' not found – skipping population estimate.")
            continue

        exists = (
            db.query(PopulationEstimate)
            .filter(
                PopulationEstimate.site_id == site.id,
                PopulationEstimate.species_id == species.id,
            )
            .first()
        )
        if exists:
            print(f"  ⏭  PopulationEstimate for '{item['species_name']}' at '{item['site_name']}' already exists – skipped.")
            continue

        estimate = PopulationEstimate(
            site_id=site.id,
            species_id=species.id,
            estimated_count=item["estimated_count"],
            density_per_sqkm=item["density_per_sqkm"],
            notes=item.get("notes"),
        )
        db.add(estimate)
        db.flush()
        print(
            f"  ✅ Population estimate: {item['species_name']} at {item['site_name']} "
            f"(Count={item['estimated_count']}, Density={item['density_per_sqkm']}/km²)."
        )


def seed_habitat_scores(db):
    """Insert habitat scores for each monitoring site."""
    for item in HABITAT_SCORES_DATA:
        site = db.query(MonitoringSite).filter(MonitoringSite.name == item["site_name"]).first()
        if not site:
            print(f"  ⚠️ Site '{item['site_name']}' not found – skipping habitat score.")
            continue

        exists = (
            db.query(HabitatScore)
            .filter(HabitatScore.site_id == site.id)
            .first()
        )
        if exists:
            print(f"  ⏭  HabitatScore for '{item['site_name']}' already exists – skipped.")
            continue

        score = HabitatScore(
            site_id=site.id,
            overall_score=item["overall_score"],
            status=item["status"],
            notes=item.get("notes"),
        )
        db.add(score)
        db.flush()
        print(f"  ✅ Habitat score: {item['site_name']} -> Score={item['overall_score']}, Status='{item['status']}'.")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🌿 Wildlife Intelligence System – Database Seeder")
    print("=" * 60)

    import app.models
    from app.core.database import Base, engine
    # Create all registered tables including PopulationEstimate & HabitatScore
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("\n📋 Seeding Users …")
        seed_users(db)

        print("\n🦁 Seeding Species …")
        seed_species(db)

        print("\n📍 Seeding Monitoring Sites …")
        seed_monitoring_sites(db)

        print("\n📊 Seeding Surveys …")
        seed_surveys(db)

        print("\n📸 Seeding Observations & Detections …")
        seed_observations_and_detections(db)

        print("\n📈 Seeding Population Estimates …")
        seed_population_estimates(db)

        print("\n🌳 Seeding Habitat Scores …")
        seed_habitat_scores(db)

        db.commit()
        print("\n" + "=" * 60)
        print("✅ All seed data committed successfully!")
        print("=" * 60)
    except Exception as exc:
        db.rollback()
        print(f"\n❌ Error during seeding: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
