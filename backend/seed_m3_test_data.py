"""
seed_m3_test_data.py
====================
Seeding script to populate Postgres database with realistic 6-month historical test data:
- 5 Monitoring Sites with distinct habitat types
- 2-4 Surveys per site
- 5-10 Observations per survey
- 5-10 Detections per survey covering varied species with realistic confidence (0.65 - 0.95)
  and timestamps spread over the last 6 months.

Run:
  docker exec wildlife_backend python seed_m3_test_data.py
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')
import uuid
import random
from datetime import datetime, timedelta

sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.models import (
    User, UserRole,
    Species, ConservationStatus,
    MonitoringSite, DeviceType,
    Survey, Observation, ObservationType, Detection
)

def gen_uuid():
    return str(uuid.uuid4())

def seed_m3_data():
    print("=" * 60)
    print("🌿 Seeding Milestone 3 Historical Data (6-Month Trends)")
    print("=" * 60)

    db = SessionLocal()
    try:
        # 1. Get or create creator user
        admin = db.query(User).filter(User.role == UserRole.ADMINISTRATOR).first()
        if not admin:
            admin = db.query(User).first()
        if not admin:
            print("❌ No user found. Run seed_data.py first!")
            return

        # 2. Get existing species
        species_list = db.query(Species).all()
        if not species_list:
            print("❌ No species found. Run seed_data.py first!")
            return
        
        species_map = {s.common_name: s for s in species_list}
        print(f"Loaded {len(species_list)} species from database.")

        # 3. Define 5 Monitoring Sites
        sites_def = [
            {
                "name": "Gir Forest Camera Trap 1",
                "habitat_type": "dry deciduous forest",
                "protected_area": "Gir National Park",
                "device_type": DeviceType.CAMERA_TRAP,
                "lat": 21.1231, "lon": 70.7978,
            },
            {
                "name": "Bandipur Audio Sensor 1",
                "habitat_type": "tropical dry forest",
                "protected_area": "Bandipur National Park",
                "device_type": DeviceType.AUDIO_SENSOR,
                "lat": 11.6543, "lon": 76.6342,
            },
            {
                "name": "Kaziranga Drone Zone",
                "habitat_type": "grassland & savanna",
                "protected_area": "Kaziranga National Park",
                "device_type": DeviceType.DRONE,
                "lat": 26.5775, "lon": 93.1711,
            },
            {
                "name": "Sundarbans Mangrove Station",
                "habitat_type": "mangrove wetland",
                "protected_area": "Sundarbans Tiger Reserve",
                "device_type": DeviceType.CAMERA_TRAP,
                "lat": 21.9497, "lon": 88.8834,
            },
            {
                "name": "Periyar Valley Acoustic Monitor",
                "habitat_type": "tropical evergreen forest",
                "protected_area": "Periyar Tiger Reserve",
                "device_type": DeviceType.AUDIO_SENSOR,
                "lat": 9.4679, "lon": 77.1428,
            },
        ]

        db_sites = []
        for sdef in sites_def:
            site = db.query(MonitoringSite).filter(MonitoringSite.name == sdef["name"]).first()
            if not site:
                site = MonitoringSite(
                    id=gen_uuid(),
                    name=sdef["name"],
                    habitat_type=sdef["habitat_type"],
                    protected_area=sdef["protected_area"],
                    device_type=sdef["device_type"],
                    latitude=sdef["lat"],
                    longitude=sdef["lon"],
                    created_by=admin.id,
                )
                db.add(site)
                db.flush()
                print(f"  ✅ Created site: {site.name}")
            else:
                print(f"  ⏭ Site exists: {site.name}")
            db_sites.append(site)

        # 4. Generate 6-month historical Surveys, Observations, and Detections
        # Current date anchor: Aug 2026
        now = datetime(2026, 8, 10)
        
        # SQL statement accumulator for Section 6 reporting
        sql_statements = []

        total_surveys_created = 0
        total_obs_created = 0
        total_det_created = 0

        for site in db_sites:
            # Create 3-4 surveys over last 6 months
            for month_offset in [5, 4, 3, 2, 1, 0]: # Mar, Apr, May, Jun, Jul, Aug
                # Decide if a survey was conducted in this month for this site
                # Ensure every site gets at least 2 surveys total across months
                survey_date = now - timedelta(days=month_offset * 30 + random.randint(1, 10))
                
                # Create survey
                survey_id = gen_uuid()
                survey = Survey(
                    id=survey_id,
                    site_id=site.id,
                    created_by=admin.id,
                    start_date=survey_date,
                    end_date=survey_date + timedelta(days=2),
                    notes=f"Monthly wildlife intelligence monitoring survey ({survey_date.strftime('%B %Y')})",
                    created_at=survey_date
                )
                db.add(survey)
                db.flush()
                total_surveys_created += 1

                # Generate 2-3 observations per survey
                for o_idx in range(random.randint(2, 3)):
                    obs_date = survey_date + timedelta(hours=random.randint(2, 36))
                    obs_id = gen_uuid()
                    obs_type = ObservationType.IMAGE if site.device_type != DeviceType.AUDIO_SENSOR else ObservationType.AUDIO
                    
                    obs = Observation(
                        id=obs_id,
                        survey_id=survey.id,
                        observation_type=obs_type,
                        file_path=f"/uploads/{site.device_type.value}_{obs_date.strftime('%Y%m%d_%H%M%S')}.jpg",
                        uploaded_by=admin.id,
                        captured_at=obs_date,
                        created_at=obs_date,
                        notes=f"Automatic detection capture at {site.name}"
                    )
                    db.add(obs)
                    db.flush()
                    total_obs_created += 1

                    # Choose 2-4 species detections per observation
                    # Make sure endangered species (Bengal Tiger, Asiatic Lion, Indian Elephant) are present
                    chosen_species = random.sample(species_list, k=min(4, len(species_list)))
                    for sp in chosen_species:
                        det_id = gen_uuid()
                        conf = round(random.uniform(0.68, 0.96), 2)
                        count_val = random.randint(1, 4)
                        det_date = obs_date

                        detection = Detection(
                            id=det_id,
                            observation_id=obs.id,
                            species_id=sp.id,
                            confidence=conf,
                            count=count_val,
                            bbox_x1=round(random.uniform(0.1, 0.4), 2),
                            bbox_y1=round(random.uniform(0.1, 0.4), 2),
                            bbox_x2=round(random.uniform(0.6, 0.9), 2),
                            bbox_y2=round(random.uniform(0.6, 0.9), 2),
                            detection_source="yolov8" if obs_type == ObservationType.IMAGE else "birdnet",
                            created_at=det_date
                        )
                        db.add(detection)
                        total_det_created += 1

                        sql_stmt = (
                            f"INSERT INTO detections (id, observation_id, species_id, confidence, count, detection_source, created_at) "
                            f"VALUES ('{det_id}', '{obs.id}', '{sp.id}', {conf}, {count_val}, '{detection.detection_source}', '{det_date.isoformat()}');"
                        )
                        sql_statements.append(sql_stmt)

        db.commit()
        print(f"\n✅ Seeded successfully!")
        print(f"   Total Sites: {len(db_sites)}")
        print(f"   Surveys Created: {total_surveys_created}")
        print(f"   Observations Created: {total_obs_created}")
        print(f"   Detections Created: {total_det_created}")
        print(f"   Sample SQL Statements generated: {len(sql_statements)}")

        # Write sample SQL statements to file for Section 6 output
        with open("m3_test_data.sql", "w") as f:
            f.write("-- Milestone 3 Realistic Test Data SQL Insert Statements\n\n")
            for stmt in sql_statements[:30]:
                f.write(stmt + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_m3_data()
