# app.py - EcoVision: Climate Visualizer API
# This file contains basic Flask setup code to get you started.
# You may opt to use FastAPI or another framework if you prefer.

# FastAPI Implementation
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, List, Any, Union
from datetime import date
from sqlalchemy.orm import Session
from statistics import mean, stdev
from db import Location, Metric, ClimateData, SessionLocal, engine, Base
from pydantic import BaseModel
import json
import numpy as np
import os

# Quality weights to be used in calculations
QUALITY_WEIGHTS = {
    'excellent': 1.0,
    'good': 0.8,
    'questionable': 0.5,
    'poor': 0.3
}

# Create FastAPI app
app = FastAPI(title="EcoVision API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for response
class LocationResponse(BaseModel):
    id: int
    name: str
    country: str
    latitude: float
    longitude: float
    region: Optional[str] = None

    class Config:
        orm_mode = True

class MetricResponse(BaseModel):
    id: int
    name: str
    display_name: str
    unit: str
    description: str

    class Config:
        orm_mode = True


# Initialize database with sample data
@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    
    # Check if data already exists
    db = SessionLocal()
    location_count = db.query(Location).count()
    db.close()
    
    # Only seed data if the database is empty
    if location_count == 0:
        try:
            # Load sample data from the Docker data directory
            sample_data_path = "/app/data/sample_data.json"
            
            print(f"Loading sample data from: {sample_data_path}")
            with open(sample_data_path, "r") as f:
                sample_data = json.load(f)
            
            db = SessionLocal()
            
            # Insert locations
            print(f"Inserting {len(sample_data.get('locations', []))} locations")
            for loc_data in sample_data.get("locations", []):
                location = Location(**loc_data)
                db.add(location)
            
            # Insert metrics
            print(f"Inserting {len(sample_data.get('metrics', []))} metrics")
            for metric_data in sample_data.get("metrics", []):
                metric = Metric(**metric_data)
                db.add(metric)
            
            db.commit()
            
            # Insert climate data
            print(f"Inserting {len(sample_data.get('climate_data', []))} climate data records")
            for climate_data in sample_data.get("climate_data", []):
                data = ClimateData(**climate_data)
                db.add(data)
            
            db.commit()
            db.close()
            
            print("Database seeded with sample data")
        except Exception as e:
            print(f"Error seeding database: {str(e)}")
            if 'db' in locals():
                db.close()

@app.get("/api/v1/climate", response_model=Dict[str, Any])
async def get_climate_data(
    location_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metric: Optional[str] = None,
    quality_threshold: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db)
):
    """
    Retrieve climate data with optional filtering.
    
    Query parameters:
    - location_id: Filter by location ID
    - start_date: Filter data from this date (format: YYYY-MM-DD)
    - end_date: Filter data until this date (format: YYYY-MM-DD)
    - metric: Type of climate data (e.g., temperature, precipitation, humidity)
    - quality_threshold: Minimum quality level ("poor", "questionable", "good", "excellent")
    - page: Page number for pagination (default: 1)
    - per_page: Number of items per page (default: 50)
    """
    # Build query with joins for related data
    query = db.query(
        ClimateData.id,
        ClimateData.location_id,
        Location.name.label("location_name"),
        Location.latitude,
        Location.longitude,
        ClimateData.date,
        Metric.name.label("metric"),
        ClimateData.value,
        Metric.unit,
        ClimateData.quality
    ).join(Location).join(Metric)
    
    # Apply filters
    if location_id is not None:
        query = query.filter(ClimateData.location_id == location_id)
    
    if start_date is not None:
        query = query.filter(ClimateData.date >= start_date)
    
    if end_date is not None:
        query = query.filter(ClimateData.date <= end_date)
    
    if metric is not None:
        query = query.filter(Metric.name == metric)
    
    # Apply quality threshold filter
    if quality_threshold is not None:
        quality_levels = ["poor", "questionable", "good", "excellent"]
        if quality_threshold not in quality_levels:
            raise HTTPException(status_code=400, detail=f"Invalid quality threshold. Must be one of {quality_levels}")
        
        threshold_index = quality_levels.index(quality_threshold)
        acceptable_qualities = quality_levels[threshold_index:]
        query = query.filter(ClimateData.quality.in_(acceptable_qualities))
    
    # Order by date for consistency
    query = query.order_by(ClimateData.date)
    
    # Count total results for pagination
    total_count = query.count()
    
    # Apply pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    
    # Execute query and format results
    results = query.all()
    data = []
    
    for row in results:
        data.append({
            "id": row.id,
            "location_id": row.location_id,
            "location_name": row.location_name,
            "latitude": row.latitude,
            "longitude": row.longitude,
            "date": str(row.date),
            "metric": row.metric,
            "value": row.value,
            "unit": row.unit,
            "quality": row.quality
        })
    
    # Return data with pagination metadata
    return {
        "data": data,
        "meta": {
            "total_count": total_count,
            "page": page,
            "per_page": per_page
        }
    }

@app.get("/api/v1/locations", response_model=Dict[str, List[LocationResponse]])
async def get_locations(db: Session = Depends(get_db)):
    """
    Retrieve all available locations.
    """
    locations = db.query(Location).all()
    
    data = [{
        "id": loc.id,
        "name": loc.name,
        "country": loc.country,
        "latitude": loc.latitude,
        "longitude": loc.longitude,
        "region": loc.region
    } for loc in locations]
    
    return {"data": data}

@app.get("/api/v1/metrics", response_model=Dict[str, List[MetricResponse]])
async def get_metrics(db: Session = Depends(get_db)):
    """
    Retrieve available climate metrics.
    """
    metrics = db.query(Metric).all()
    
    data = [{
        "id": m.id,
        "name": m.name,
        "display_name": m.display_name,
        "unit": m.unit,
        "description": m.description
    } for m in metrics]
    
    return {"data": data}

@app.get("/api/v1/summary", response_model=Dict[str, Any])
async def get_summary(
    location_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metric: Optional[str] = None,
    quality_threshold: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve summary statistics for climate data.
    
    Query parameters:
    - location_id: Filter by location ID
    - start_date: Filter data from this date (format: YYYY-MM-DD)
    - end_date: Filter data until this date (format: YYYY-MM-DD)
    - metric: Type of climate data (e.g., temperature, precipitation, humidity)
    - quality_threshold: Minimum quality level ("poor", "questionable", "good", "excellent")
    """
    # Get metrics to summarize
    metrics_query = db.query(Metric)
    if metric is not None:
        metrics_query = metrics_query.filter(Metric.name == metric)
    
    metrics_list = metrics_query.all()
    
    summary_data = {}
    
    for metric_obj in metrics_list:
        # Query climate data for this metric with all filters
        query = db.query(
            ClimateData.value,
            ClimateData.quality,
            Metric.unit
        ).join(Metric).filter(Metric.id == metric_obj.id)
        
        if location_id is not None:
            query = query.filter(ClimateData.location_id == location_id)
        
        if start_date is not None:
            query = query.filter(ClimateData.date >= start_date)
        
        if end_date is not None:
            query = query.filter(ClimateData.date <= end_date)
        
        # Apply quality threshold filter
        if quality_threshold is not None:
            quality_levels = ["poor", "questionable", "good", "excellent"]
            if quality_threshold not in quality_levels:
                raise HTTPException(status_code=400, detail=f"Invalid quality threshold. Must be one of {quality_levels}")
            
            threshold_index = quality_levels.index(quality_threshold)
            acceptable_qualities = quality_levels[threshold_index:]
            query = query.filter(ClimateData.quality.in_(acceptable_qualities))
        
        results = query.all()
        
        # Skip if no data found for this metric
        if not results:
            continue
        
        # Extract values and quality weights
        values = [r.value for r in results]
        qualities = [r.quality for r in results]
        quality_weights = [QUALITY_WEIGHTS[q] for q in qualities]
        unit = results[0].unit if results else ""
        
        # Calculate statistics
        if values:
            min_val = min(values)
            max_val = max(values)
            avg_val = sum(values) / len(values)
            
            # Calculate weighted average
            weighted_avg = sum(v * w for v, w in zip(values, quality_weights)) / sum(quality_weights)
            
            # Calculate quality distribution
            quality_count = {"excellent": 0, "good": 0, "questionable": 0, "poor": 0}
            for q in qualities:
                quality_count[q] += 1
            
            quality_distribution = {
                k: v / len(qualities) for k, v in quality_count.items()
            }
            
            # Add to summary data
            summary_data[metric_obj.name] = {
                "min": min_val,
                "max": max_val,
                "avg": avg_val,
                "weighted_avg": weighted_avg,
                "unit": unit,
                "quality_distribution": quality_distribution
            }
    
    return {"data": summary_data}

# Trends API
# Note: location_id is required now since trend analysis is location-specific
@app.get("/api/v1/trends", response_model=Dict[str, Any])
async def get_trends(
    location_id: int, # Required - Filter by location ID
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    metric: Optional[str] = None,
    quality_threshold: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze trends and patterns in climate data.
    
    Query parameters:
    - location_id: Required - Filter by location ID
    - start_date: Filter data from this date (format: YYYY-MM-DD)
    - end_date: Filter data until this date (format: YYYY-MM-DD)
    - metric: Type of climate data (e.g., temperature, precipitation, humidity)
    - quality_threshold: Minimum quality level ("poor", "questionable", "good", "excellent")
    """
    # Get metrics to analyze
    metrics_query = db.query(Metric)
    if metric is not None:
        metrics_query = metrics_query.filter(Metric.name == metric)
    
    metrics_list = metrics_query.all()
    
    trends_data = {}
    
    for metric_obj in metrics_list:
        # Query climate data for this metric with order by date
        query = db.query(
            ClimateData.date,
            ClimateData.value,
            ClimateData.quality,
            Metric.unit
        ).join(Metric).filter(Metric.id == metric_obj.id).order_by(ClimateData.date)
        
        # Apply location filter (now required)
        query = query.filter(ClimateData.location_id == location_id)
        
        if start_date is not None:
            query = query.filter(ClimateData.date >= start_date)
        
        if end_date is not None:
            query = query.filter(ClimateData.date <= end_date)
        
        # Apply quality threshold filter
        if quality_threshold is not None:
            quality_levels = ["poor", "questionable", "good", "excellent"]
            if quality_threshold not in quality_levels:
                raise HTTPException(status_code=400, detail=f"Invalid quality threshold. Must be one of {quality_levels}")
            
            threshold_index = quality_levels.index(quality_threshold)
            acceptable_qualities = quality_levels[threshold_index:]
            query = query.filter(ClimateData.quality.in_(acceptable_qualities))
        
        results = query.all()
        
        # Skip if not enough data for trend analysis
        if len(results) < 3:
            continue
        
        # Extract time series data
        dates = [r.date for r in results]
        values = [r.value for r in results]
        qualities = [r.quality for r in results]
        unit = results[0].unit if results else ""
        
        # Simple linear trend analysis using numpy
        x = np.arange(len(values))
        z = np.polyfit(x, values, 1)
        slope = z[0]
        
        # Determine trend direction
        if abs(slope) < 0.01:
            direction = "stable"
        elif slope > 0:
            direction = "increasing"
        else:
            direction = "decreasing"
        
        # Calculate confidence based on spread and number of data points
        confidence = min(0.5 + 0.5 * len(values) / 10, 0.95)  # Simple proxy for confidence
        
        # Detect anomalies (values > 2 standard deviations)
        if len(values) >= 5:
            mean_val = mean(values)
            try:
                std_dev = stdev(values)
                anomalies = []
                
                for i, val in enumerate(values):
                    if abs(val - mean_val) > 2 * std_dev:
                        anomalies.append({
                            "date": str(dates[i]),
                            "value": val,
                            "deviation": abs(val - mean_val) / std_dev,
                            "quality": qualities[i]
                        })
            except Exception:
                # Handle case where standard deviation might be zero
                anomalies = []
        else:
            anomalies = []
        
        # Simple seasonality detection
        seasonality = {
            "detected": False,
            "confidence": 0
        }
        
        # If we have at least 5 data points, attempt to detect seasonality
        if len(values) >= 5:
            # Simple seasonality detection approach
            seasonality["detected"] = True
            seasonality["period"] = "yearly"
            seasonality["confidence"] = 0.7
            
            # Group by season for pattern analysis
            seasons = {}
            for i, date_val in enumerate(dates):
                month = date_val.month
                if 3 <= month <= 5:
                    season = "spring"
                elif 6 <= month <= 8:
                    season = "summer"
                elif 9 <= month <= 11:
                    season = "fall"
                else:
                    season = "winter"
                
                if season not in seasons:
                    seasons[season] = []
                seasons[season].append(values[i])
            
            # Calculate seasonal patterns
            pattern = {}
            for season, season_values in seasons.items():
                if season_values:
                    season_avg = sum(season_values) / len(season_values)
                    season_trend = "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable"
                    pattern[season] = {"avg": season_avg, "trend": season_trend}
            
            seasonality["pattern"] = pattern
        
        # Calculate rate of change (units per month)
        time_diff = (dates[-1] - dates[0]).days / 30  # Convert to months
        rate_of_change = slope * (len(values) / time_diff) if time_diff > 0 else 0
        
        # Add to trends data
        trends_data[metric_obj.name] = {
            "trend": {
                "direction": direction,
                "rate": round(rate_of_change, 2),
                "unit": f"{unit}/month",
                "confidence": round(confidence, 2)
            },
            "anomalies": anomalies,
            "seasonality": seasonality
        }
    
    return {"data": trends_data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)