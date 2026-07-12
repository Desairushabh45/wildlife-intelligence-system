"""
seed_data.py – Populate wildlife_db with realistic sample data for Milestone 1 demo.

Run from the backend/ directory:
    python seed_data.py
"""

import sys
from datetime import datetime

from passlib.context import CryptContext
from geoalchemy2 import WKTElement

# ── Bootstrap ────────────────────────────────────────────────────────────────
# Ensure the app package is importable when running from backend/.
sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.models import (
    User, UserRole,
    Species, ConservationStatus,
    MonitoringSite, DeviceType,
    Survey,
)

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
]

SPECIES_LIST = [
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
]

SITES = [
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
            location=WKTElement(
                f"POINT({data['longitude']} {data['latitude']})", srid=4326
            ),
            created_by=creator.id,
        )
        db.add(site)
        db.flush()
        print(f"  ✅ Site '{data['name']}' in {data['protected_area']} inserted.")


def seed_surveys(db, creator_email="priya@wildlife.com"):
    """Insert surveys linked to their monitoring sites and the given user."""
    creator = db.query(User).filter(User.email == creator_email).first()
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
            notes=data["notes"],
        )
        db.add(survey)
        db.flush()
        print(f"  ✅ Survey at '{data['site_name']}' on {data['start_date'].date()} inserted.")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🌿 Wildlife Intelligence System – Database Seeder")
    print("=" * 60)

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
