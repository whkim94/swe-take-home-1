# Database setup
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from typing import Optional
import os
from datetime import date

# Database setup
DATABASE_URL = f"postgresql://{os.environ.get('DB_USER', 'postgres')}:{os.environ.get('DB_PASSWORD', 'postgres')}@{os.environ.get('DB_HOST', 'localhost')}/{os.environ.get('DB_NAME', 'climate_data')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    region = Column(String, nullable=True)
    
    climate_data = relationship("ClimateData", back_populates="location")

class Metric(Base):
    __tablename__ = "metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True)
    display_name = Column(String)
    unit = Column(String)
    description = Column(String)
    
    climate_data = relationship("ClimateData", back_populates="metric")

class ClimateData(Base):
    __tablename__ = "climate_data"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    metric_id = Column(Integer, ForeignKey("metrics.id"))
    date = Column(Date, index=True)
    value = Column(Float)
    quality = Column(String)
    
    location = relationship("Location", back_populates="climate_data")
    metric = relationship("Metric", back_populates="climate_data")
