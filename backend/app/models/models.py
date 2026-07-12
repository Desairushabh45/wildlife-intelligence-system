import enum
import uuid
from datetime import datetime

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    WILDLIFE_RESEARCHER = "wildlife_researcher"
    CONSERVATION_OFFICER = "conservation_officer"
    FOREST_DEPARTMENT_OFFICER = "forest_department_officer"
    ADMINISTRATOR = "administrator"


class DeviceType(str, enum.Enum):
    CAMERA_TRAP = "camera_trap"
    AUDIO_SENSOR = "audio_sensor"
    DRONE = "drone"


class ConservationStatus(str, enum.Enum):
    LEAST_CONCERN = "least_concern"
    NEAR_THREATENED = "near_threatened"
    VULNERABLE = "vulnerable"
    ENDANGERED = "endangered"
    CRITICALLY_ENDANGERED = "critically_endangered"
    DATA_DEFICIENT = "data_deficient"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.WILDLIFE_RESEARCHER)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    sites = relationship("MonitoringSite", back_populates="created_by_user")
    surveys = relationship("Survey", back_populates="created_by_user")


class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    habitat_type = Column(String, nullable=True)
    protected_area = Column(String, nullable=True)
    device_type = Column(Enum(DeviceType), nullable=False)
    location = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    created_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by_user = relationship("User", back_populates="sites")
    surveys = relationship("Survey", back_populates="site", cascade="all, delete-orphan")


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    site_id = Column(UUID(as_uuid=False), ForeignKey("monitoring_sites.id"), nullable=False)
    created_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("MonitoringSite", back_populates="surveys")
    created_by_user = relationship("User", back_populates="surveys")
    observations = relationship("Observation", back_populates="survey", cascade="all, delete-orphan")


class ObservationType(str, enum.Enum):
    IMAGE = "image"
    AUDIO = "audio"


class Observation(Base):
    __tablename__ = "observations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    survey_id = Column(UUID(as_uuid=False), ForeignKey("surveys.id"), nullable=False)
    observation_type = Column(Enum(ObservationType), nullable=False)
    file_path = Column(String, nullable=False)
    mongo_metadata_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    uploaded_by = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    captured_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    survey = relationship("Survey", back_populates="observations")
    uploaded_by_user = relationship("User")
    detections = relationship("Detection", back_populates="observation", cascade="all, delete-orphan")


class Species(Base):
    __tablename__ = "species"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    scientific_name = Column(String, unique=True, nullable=False, index=True)
    common_name = Column(String, nullable=False)
    taxonomic_class = Column(String, nullable=True)
    conservation_status = Column(
        Enum(ConservationStatus), nullable=False, default=ConservationStatus.LEAST_CONCERN
    )
    is_endangered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    detections = relationship("Detection", back_populates="species")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    observation_id = Column(UUID(as_uuid=False), ForeignKey("observations.id"), nullable=False)
    species_id = Column(UUID(as_uuid=False), ForeignKey("species.id"), nullable=False)
    confidence = Column(Float, nullable=False)
    count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    observation = relationship("Observation", back_populates="detections")
    species = relationship("Species", back_populates="detections")
